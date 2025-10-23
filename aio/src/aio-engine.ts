import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { GitHubService } from "./github-service.js";
import { GitService } from "./git-service.js";
import { TemplateService } from "./template-service.js";
import {
  WorkPackageData,
  PRMetadata,
  AIOState,
  Config,
  TemplateData,
} from "./types.js";

export class AIOEngine {
  private githubService: GitHubService;
  private gitService: GitService;
  private templateService: TemplateService;
  private config: Config;

  constructor() {
    this.config = {
      githubToken: process.env.GITHUB_TOKEN || "",
      owner: process.env.GITHUB_OWNER || "",
      repo: process.env.GITHUB_REPO || "",
    };

    if (!this.config.githubToken || !this.config.owner || !this.config.repo) {
      throw new Error(
        "Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO"
      );
    }

    this.githubService = new GitHubService(this.config);
    this.gitService = new GitService();
    this.templateService = new TemplateService();
  }

  async run(issueId: string): Promise<void> {
    const workPackageData = await this.prepareWorkPackageData(issueId);
    const state = this.determineState(workPackageData);

    console.log(`Processing issue #${issueId} in state: ${state}`);

    switch (state) {
      case "BOOTSTRAP":
        await this.handleBootstrap(workPackageData);
        break;
      case "PLAN-FEEDBACK":
        await this.handlePlanFeedback(workPackageData);
        break;
      case "PLAN-APPROVED":
        await this.handlePlanApproved(workPackageData);
        break;
      case "REVIEW-FEEDBACK":
        await this.handleReviewFeedback(workPackageData);
        break;
      case "READY-TO-MERGE":
        await this.handleReadyToMerge(workPackageData);
        break;
      default:
        await this.handleUndetermined(workPackageData);
        break;
    }
  }

  private async prepareWorkPackageData(
    issueId: string
  ): Promise<WorkPackageData> {
    const issue = await this.githubService.getIssue(issueId);
    const nameSlug = this.createNameSlug(issue.title);
    const workPackageName = `issues/${issue.number}-${nameSlug}`;

    // Ensure branch exists and switch to it
    this.gitService.ensureBranchAndSwitch(workPackageName);

    let pullRequest = undefined;
    let comments: any[] = [];
    let checks: any[] = [];

    // Check if PR exists
    const prMetadataPath = join(process.cwd(), workPackageName, "pr.json");
    if (existsSync(prMetadataPath)) {
      const prMetadata: PRMetadata = JSON.parse(
        readFileSync(prMetadataPath, "utf-8")
      );
      pullRequest = await this.githubService.getPullRequest(prMetadata.id);

      // Get comments from both issue and PR
      const issueComments = await this.githubService.getIssueComments(
        issue.number
      );
      const prComments = await this.githubService.getPullRequestComments(
        prMetadata.id
      );
      comments = [...issueComments, ...prComments];

      // filter out irrelevant comments
      comments = comments.filter(
        (comment) => !comment.body.includes("AI Generated Content")
      );

      // Get CI checks
      checks = await this.githubService.getChecks(pullRequest.head.ref);
    } else {
      comments = await this.githubService.getIssueComments(issue.number);
    }

    return {
      issue,
      pullRequest,
      comments,
      checks,
      workPackageName,
      nameSlug,
    };
  }

  private determineState(data: WorkPackageData): AIOState {
    const labels = data.issue.labels.map((l) => l.name);
    console.log(`Issue #${data.issue.number} has labels: ${labels.join(", ")}`);

    if (labels.includes("ready-to-merge")) {
      return "READY-TO-MERGE";
    }

    if (labels.includes("in-review")) {
      const qaPath = join(process.cwd(), data.workPackageName, "qa.md");
      if (existsSync(qaPath)) {
        return "REVIEW-FEEDBACK";
      }
    }

    if (labels.includes("plan-approved")) {
      return "PLAN-APPROVED";
    }

    if (labels.includes("plan-proposed") && data.comments.length > 0) {
      return "PLAN-FEEDBACK";
    }

    if (labels.includes("ready-for-agent")) {
      return "BOOTSTRAP";
    }

    // Default to UNDETERMINED which calls a noop if no labels match but issue exists
    return "UNDETERMINED";
  }

  private async handleBootstrap(data: WorkPackageData): Promise<void> {
    // Create folder
    mkdirSync(data.workPackageName, { recursive: true });

    // Write TASK.md and cost.md locally first
    const templateData = this.createTemplateData(data);
    const taskContent = this.templateService.renderBootstrap(templateData);
    const costContent = this.templateService.renderCost(templateData);

    this.templateService.writeTaskFile(data.workPackageName, taskContent);
    this.templateService.writeCostFile(data.workPackageName, costContent);

    // Always commit and push the bootstrap files to create commits for PR
    await this.commitAndPush(data, "chore(aio): bootstrapping ai work package");

    // Create PR
    const pr = await this.githubService.createPullRequest(
      `agent(#${data.issue.number}): ${data.issue.title}`,
      `Closes #${data.issue.number}`,
      data.workPackageName,
      "main",
      true
    );

    // Store PR metadata
    const prMetadata: PRMetadata = { id: pr.number };
    writeFileSync(
      join(process.cwd(), data.workPackageName, "pr.json"),
      JSON.stringify(prMetadata, null, 2)
    );

    // Remove ready-for-agent label and add plan-proposed and locked
    await this.githubService.removeLabelFromIssue(
      data.issue.number,
      "ready-for-agent"
    );
    await this.githubService.addLabelToIssue(
      data.issue.number,
      "plan-proposed"
    );
    await this.githubService.addLabelToIssue(data.issue.number, "locked");

    // Output prompt
    this.outputPrompt(templateData);
  }

  private async handlePlanFeedback(data: WorkPackageData): Promise<void> {
    const planPath = join(process.cwd(), data.workPackageName, "PLAN.md");
    if (!existsSync(planPath)) {
      console.log(
        "PLAN.md does not exist. Please look at the Github issue again and assign the label 'ready-for-agent' if needed."
      );
      return;
    }

    // Create or override TASK.md
    const templateData = this.createTemplateData(data);
    const taskContent = this.templateService.renderPlanFeedback(templateData);
    this.templateService.writeTaskFile(data.workPackageName, taskContent);

    await this.commitAndPush(
      data,
      "chore(aio): update task with plan feedback"
    );
    this.outputPrompt(templateData);
  }

  private async handlePlanApproved(data: WorkPackageData): Promise<void> {
    // Remove plan-approved and add in-review and locked
    await this.githubService.removeLabelFromIssue(
      data.issue.number,
      "plan-approved"
    );
    await this.githubService.addLabelToIssue(data.issue.number, "in-review");
    await this.githubService.addLabelToIssue(data.issue.number, "locked");

    // Create or override TASK.md
    const templateData = this.createTemplateData(data);
    const taskContent = this.templateService.renderPlanApproved(templateData);
    this.templateService.writeTaskFile(data.workPackageName, taskContent);

    await this.commitAndPush(
      data,
      "chore(aio): update task for for implementation"
    );
    this.outputPrompt(templateData);
  }

  private async handleReviewFeedback(data: WorkPackageData): Promise<void> {
    const qaPath = join(process.cwd(), data.workPackageName, "qa.md");
    const qaContent =
      "[AI Generated Content]\n\n" + readFileSync(qaPath, "utf-8");
    await this.githubService.addCommentToIssue(data.issue.number, qaContent);

    const templateData = this.createTemplateData(data);
    const taskContent = this.templateService.renderReviewFeedback(templateData);
    this.templateService.writeTaskFile(data.workPackageName, taskContent);

    await this.commitAndPush(data, "chore(aio): report fixes required");
    this.outputPrompt(templateData);
    // CI is green - remove locked label and post QA comment
    try {
      await this.githubService.removeLabelFromIssue(
        data.issue.number,
        "locked"
      );
    } catch (error) {
      // noop - continue if label removal fails
    }
  }

  private async handleReadyToMerge(data: WorkPackageData): Promise<void> {
    if (!data.pullRequest) {
      throw new Error("No pull request found for ready-to-merge state");
    }

    // Remove all labels from issue and PR
    await this.githubService.removeAllLabelsFromIssue(data.issue.number);
    await this.githubService.removeAllLabelsFromPullRequest(
      data.pullRequest.number
    );

    // Add cost comment to issue
    const costPath = join(process.cwd(), data.workPackageName, "cost.md");
    if (existsSync(costPath)) {
      const costContent =
        "[AI Generated Content]\n\n" + readFileSync(costPath, "utf-8");
      await this.githubService.addCommentToIssue(
        data.issue.number,
        costContent
      );
    }

    // Delete issue flow files under /issues
    const issueDir = join(process.cwd(), data.workPackageName);
    if (existsSync(issueDir)) {
      rmSync(issueDir, { recursive: true, force: true });
      console.log(`Deleted issue flow files: ${data.workPackageName}`);
    }

    // Commit and push the changes
    this.gitService.addAllFiles();
    if (this.gitService.hasUncommittedChanges()) {
      this.gitService.commit(`chore: cleanup issue flow files for #${data.issue.number}`);
      this.gitService.push();
      console.log("Committed and pushed cleanup changes");
    }

    // Merge PR
    await this.githubService.mergePullRequest(data.pullRequest.number);

    console.log("You successfully completed this task! Congrats!");
  }

  private async handleUndetermined(data: WorkPackageData): Promise<void> {
    console.log(`Issue #${data.issue.number} is in an undetermined state.`);
    console.log(
      "If you want an AI Agent to work on it, please add the label 'ready-for-agent' to the Github Ticket and re-run the script!"
    );
  }

  private createNameSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private createTemplateData(
    data: WorkPackageData,
    qaContent?: string
  ): TemplateData {
    return {
      ...data,
      qaContent,
    };
  }

  private async commitAndPush(
    data: WorkPackageData,
    message: string
  ): Promise<void> {
    this.gitService.addAllFiles();
    if (this.gitService.hasUncommittedChanges()) {
      this.gitService.commit(message);
      this.gitService.push(data.workPackageName);
    } else {
      // Create an empty commit to ensure there's something to create PR with
      this.gitService.commitAllowEmpty(message);
      this.gitService.push(data.workPackageName);
    }
  }

  private outputPrompt(data: TemplateData): void {
    console.log(this.templateService.renderPrompt(data));
  }
}
