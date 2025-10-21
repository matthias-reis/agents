export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: Array<{
    id: number;
    name: string;
  }>;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | "merged";
  labels: Array<{
    id: number;
    name: string;
  }>;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
}

export interface GitHubCheck {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  output?: {
    title: string;
    summary: string;
  };
}

export interface WorkPackageData {
  issue: GitHubIssue;
  pullRequest?: GitHubPullRequest;
  comments: GitHubComment[];
  checks: GitHubCheck[];
  workPackageName: string;
  nameSlug: string;
}

export interface PRMetadata {
  id: number;
}

export type AIOState =
  | "BOOTSTRAP"
  | "PLAN-FEEDBACK"
  | "PLAN-APPROVED"
  | "REVIEW-FEEDBACK"
  | "READY-TO-MERGE"
  | "UNDETERMINED";

export interface TemplateData {
  issue: GitHubIssue;
  pullRequest?: GitHubPullRequest;
  comments: GitHubComment[];
  checks: GitHubCheck[];
  workPackageName: string;
  nameSlug: string;
  qaContent?: string;
}

export interface Config {
  githubToken: string;
  owner: string;
  repo: string;
}
