import { Octokit } from "octokit";
import {
  GitHubIssue,
  GitHubPullRequest,
  GitHubComment,
  GitHubCheck,
  Config,
} from "./types.js";

export class GitHubService {
  private octokit: Octokit;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.githubToken,
    });
  }

  async getIssue(issueNumber: string): Promise<GitHubIssue> {
    const response = await this.octokit.rest.issues.get({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: parseInt(issueNumber),
    });
    return response.data as GitHubIssue;
  }

  async getPullRequest(prNumber: number): Promise<GitHubPullRequest> {
    const response = await this.octokit.rest.pulls.get({
      owner: this.config.owner,
      repo: this.config.repo,
      pull_number: prNumber,
    });
    return response.data as GitHubPullRequest;
  }

  async getIssueComments(issueNumber: number): Promise<GitHubComment[]> {
    const response = await this.octokit.rest.issues.listComments({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
    });
    return response.data as GitHubComment[];
  }

  async getPullRequestComments(prNumber: number): Promise<GitHubComment[]> {
    const response = await this.octokit.rest.pulls.listReviewComments({
      owner: this.config.owner,
      repo: this.config.repo,
      pull_number: prNumber,
    });
    return response.data as GitHubComment[];
  }

  async getChecks(ref: string): Promise<GitHubCheck[]> {
    const response = await this.octokit.rest.checks.listForRef({
      owner: this.config.owner,
      repo: this.config.repo,
      ref,
    });
    return response.data.check_runs as GitHubCheck[];
  }

  async addLabelToIssue(issueNumber: number, label: string): Promise<void> {
    await this.octokit.rest.issues.addLabels({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
      labels: [label],
    });
  }

  async removeLabelFromIssue(
    issueNumber: number,
    label: string
  ): Promise<void> {
    await this.octokit.rest.issues.removeLabel({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
      name: label,
    });
  }

  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string = "main",
    draft: boolean = false
  ): Promise<GitHubPullRequest> {
    const response = await this.octokit.rest.pulls.create({
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      body,
      head,
      base,
      draft,
    });
    return response.data as GitHubPullRequest;
  }

  async addCommentToIssue(issueNumber: number, body: string): Promise<void> {
    await this.octokit.rest.issues.createComment({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
      body,
    });
  }

  async mergePullRequest(prNumber: number): Promise<void> {
    await this.octokit.rest.pulls.merge({
      owner: this.config.owner,
      repo: this.config.repo,
      pull_number: prNumber,
      merge_method: "squash",
    });
  }

  async removeAllLabelsFromIssue(issueNumber: number): Promise<void> {
    const issue = await this.getIssue(issueNumber.toString());
    for (const label of issue.labels) {
      await this.removeLabelFromIssue(issueNumber, label.name);
    }
  }

  async removeAllLabelsFromPullRequest(prNumber: number): Promise<void> {
    const pr = await this.getPullRequest(prNumber);
    for (const label of pr.labels) {
      await this.octokit.rest.issues.removeLabel({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: prNumber,
        name: label.name,
      });
    }
  }
}
