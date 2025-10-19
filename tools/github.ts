import { Octokit } from 'octokit';

export interface RepoRef {
  owner: string;
  repo: string;
}

export interface PullRequestSummary {
  id: number;
  number: number;
  title: string;
  url: string;
  headRef: string;
  baseRef: string;
  draft: boolean;
  state: string;
  mergeable: boolean | null;
  mergeableState?: string | null;
  commits: number;
  headSha: string;
}

export interface TimelineCursor {
  since?: string;
}

export function createOctokit(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'codex-agent-cli/1.0.0',
  });
}

export function parseRepoSlug(slug: string): RepoRef {
  const [owner, repo] = slug.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid REPO slug "${slug}". Expected "owner/repo".`);
  }
  return { owner, repo };
}

export async function getIssue(octokit: Octokit, repo: RepoRef, issueNumber: number) {
  const { data } = await octokit.rest.issues.get({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issueNumber,
  });
  return data;
}

export async function listIssueComments(
  octokit: Octokit,
  repo: RepoRef,
  issueNumber: number,
  cursor: TimelineCursor = {},
) {
  const { data } = await octokit.rest.issues.listComments({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issueNumber,
    per_page: 100,
    since: cursor.since,
  });
  return data;
}

export async function addIssueLabels(
  octokit: Octokit,
  repo: RepoRef,
  issueNumber: number,
  labels: string[],
) {
  if (!labels.length) return;
  try {
    await octokit.rest.issues.addLabels({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: issueNumber,
      labels,
    });
  } catch (error: any) {
    if (error?.status === 422) return;
    throw error;
  }
}

export async function removeIssueLabel(
  octokit: Octokit,
  repo: RepoRef,
  issueNumber: number,
  label: string,
) {
  try {
    await octokit.rest.issues.removeLabel({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: issueNumber,
      name: label,
    });
  } catch (error: any) {
    if (error?.status === 404) return;
    throw error;
  }
}

export async function postIssueComment(
  octokit: Octokit,
  repo: RepoRef,
  issueNumber: number,
  body: string,
) {
  await octokit.rest.issues.createComment({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issueNumber,
    body,
  });
}

export async function postPRComment(octokit: Octokit, repo: RepoRef, prNumber: number, body: string) {
  const { data } = await octokit.rest.issues.createComment({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: prNumber,
    body,
  });
  return data;
}

export async function findPullRequestByHead(
  octokit: Octokit,
  repo: RepoRef,
  headRef: string,
): Promise<PullRequestSummary | null> {
  const { data } = await octokit.rest.pulls.list({
    owner: repo.owner,
    repo: repo.repo,
    head: `${repo.owner}:${headRef}`,
    state: 'all',
    per_page: 1,
  });

  if (!data.length) return null;
  return mapPullRequest(data[0]);
}

export async function createDraftPullRequest(
  octokit: Octokit,
  repo: RepoRef,
  params: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  },
): Promise<PullRequestSummary> {
  const { data } = await octokit.rest.pulls.create({
    owner: repo.owner,
    repo: repo.repo,
    head: params.head,
    base: params.base,
    title: params.title,
    body: params.body,
    draft: params.draft ?? true,
  });
  return mapPullRequest(data);
}

export async function getPullRequest(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
): Promise<PullRequestSummary> {
  const { data } = await octokit.rest.pulls.get({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: prNumber,
  });
  return mapPullRequest(data);
}

export async function listReviewComments(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
  cursor: TimelineCursor = {},
) {
  const { data } = await octokit.rest.pulls.listReviewComments({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: prNumber,
    per_page: 100,
    since: cursor.since,
  });
  return data;
}

export async function listReviews(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
  cursor: TimelineCursor = {},
) {
  const { data } = await octokit.rest.pulls.listReviews({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: prNumber,
    per_page: 100,
  });
  if (!cursor.since) return data;
  return data.filter((review) => {
    if (!review.submitted_at) return false;
    return review.submitted_at > cursor.since!;
  });
}

export async function markPrReadyForReview(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
): Promise<void> {
  await octokit.rest.pulls.update({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: prNumber,
    draft: false,
  });
}

export async function updatePullRequest(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
  params: Partial<{ title: string; body: string; draft: boolean }>,
): Promise<void> {
  await octokit.rest.pulls.update({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: prNumber,
    ...params,
  });
}

export async function mergePullRequest(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
  commitMessage?: string,
) {
  await octokit.rest.pulls.merge({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: prNumber,
    merge_method: 'squash',
    ...(commitMessage ? { commit_title: commitMessage } : {}),
  });
}

export async function deleteBranch(octokit: Octokit, repo: RepoRef, branch: string) {
  try {
    await octokit.rest.git.deleteRef({
      owner: repo.owner,
      repo: repo.repo,
      ref: `heads/${branch}`,
    });
  } catch (error: any) {
    if (error?.status === 422 || error?.status === 404) return;
    throw error;
  }
}

export async function addPullRequestLabels(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
  labels: string[],
) {
  await addIssueLabels(octokit, repo, prNumber, labels);
}

export async function listChecksForRef(octokit: Octokit, repo: RepoRef, ref: string) {
  const { data } = await octokit.rest.checks.listForRef({
    owner: repo.owner,
    repo: repo.repo,
    ref,
  });
  return data.check_runs;
}

export async function listWorkflowRunsForPullRequest(
  octokit: Octokit,
  repo: RepoRef,
  prNumber: number,
) {
  const { data } = await octokit.rest.actions.listWorkflowRunsForPullRequest({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: prNumber,
    per_page: 20,
  });
  return data.workflow_runs;
}

export async function listJobsForWorkflowRun(octokit: Octokit, repo: RepoRef, runId: number) {
  const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner: repo.owner,
    repo: repo.repo,
    run_id: runId,
    per_page: 50,
  });
  return data.jobs;
}

function mapPullRequest(pr: any): PullRequestSummary {
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    headRef: pr.head.ref,
    baseRef: pr.base.ref,
    draft: Boolean(pr.draft),
    state: pr.state,
    mergeable: pr.mergeable,
    mergeableState: pr.mergeable_state,
    commits: pr.commits ?? 0,
    headSha: pr.head.sha,
  };
}
