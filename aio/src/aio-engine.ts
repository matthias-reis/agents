import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
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
      case "PLAN-PROPOSED":
        await this.handlePlanProposed(workPackageData);
        break;
      case "PLAN-APPROVED":
        await this.handlePlanApproved(workPackageData);
        break;
      case "REVIEW":
        await this.handleReview(workPackageData);
        break;
      case "READY-TO-MERGE":
        await this.handleReadyToMerge(workPackageData);
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

    if (labels.includes("in-review") && labels.includes("locked")) {
      const qaPath = join(process.cwd(), data.workPackageName, "qa.md");
      if (existsSync(qaPath)) {
        return "REVIEW";
      }
    }

    if (labels.includes("plan-approved")) {
      return "PLAN-APPROVED";
    }

    if (labels.includes("plan-proposed") && data.comments.length > 0) {
      return "PLAN-PROPOSED";
    }

    if (labels.includes("ready-for-agent")) {
      return "BOOTSTRAP";
    }

    // Default to BOOTSTRAP if no labels match but issue exists
    console.log(
      `No matching state found for issue #${data.issue.number}, defaulting to BOOTSTRAP`
    );
    return "BOOTSTRAP";
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
    await this.commitAndPush(data, "Initial bootstrap setup");

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

  private async handlePlanProposed(data: WorkPackageData): Promise<void> {
    const planPath = join(process.cwd(), data.workPackageName, "PLAN.md");
    if (!existsSync(planPath)) {
      console.log("PLAN.md does not exist. Bailing out.");
      return;
    }

    // Create or override TASK.md
    const templateData = this.createTemplateData(data);
    const taskContent = this.templateService.renderPlanFeedback(templateData);
    this.templateService.writeTaskFile(data.workPackageName, taskContent);

    await this.commitAndPush(data, "Update task with plan feedback");
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

    await this.commitAndPush(data, "Plan approved - ready for implementation");
    this.outputPrompt(templateData);
  }

  private async handleReview(data: WorkPackageData): Promise<void> {
    const qaPath = join(process.cwd(), data.workPackageName, "qa.md");
    const qaContent = readFileSync(qaPath, "utf-8");

    // Check CI status
    const hasFailedChecks = data.checks.some(
      (check) => check.conclusion === "failure"
    );

    if (hasFailedChecks) {
      // CI is red - create task with CI failed template
      const templateData = this.createTemplateData(data);
      const taskContent = this.templateService.renderCiFailed(templateData);
      this.templateService.writeTaskFile(data.workPackageName, taskContent);

      await this.commitAndPush(data, "CI failed - fix required");
      this.outputPrompt(templateData);
    } else {
      // CI is green - remove locked label and post QA comment
      await this.githubService.removeLabelFromIssue(
        data.issue.number,
        "locked"
      );
      await this.githubService.addCommentToIssue(data.issue.number, qaContent);

      const templateData = this.createTemplateData(data, qaContent);
      console.log(this.templateService.renderQa(templateData));
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
      const costContent = readFileSync(costPath, "utf-8");
      await this.githubService.addCommentToIssue(
        data.issue.number,
        costContent
      );
    }

    // Merge PR
    await this.githubService.mergePullRequest(data.pullRequest.number);

    console.log("You successfully completed this task! Congrats!");
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
