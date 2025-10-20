#!/usr/bin/env node
import 'dotenv/config';
import { promisify } from 'util';
import { execFile } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { z } from 'zod';
import {
  createOctokit,
  parseRepoSlug,
  getIssue,
  listIssueComments,
  addIssueLabels,
  removeIssueLabel,
  findPullRequestByHead,
  createDraftPullRequest,
  getPullRequest,
  markPrReadyForReview,
  postIssueComment,
  postPRComment,
  addPullRequestLabels,
  listReviewComments,
  listReviews,
  listChecksForRef,
  listWorkflowRunsForPullRequest,
  listJobsForWorkflowRun,
  mergePullRequest,
  deleteBranch,
} from './github.js';
import {
  slugify,
  getIssuePaths,
  ensureIssueDirectory,
  ensureTaskFile,
  ensureScaffold,
  ensureCostsLedger,
  readFileIfExists,
  writeJsonFile,
  collectContextRegistryLinks,
} from './io.js';
import { determineState } from './state.js';
import { COSTS_FILENAME, readCostEntries, sumCosts, formatTotalLine } from './costs.js';
import {
  renderStateTemplate,
  type StateTemplateModel,
  type TemplateComment,
  type TemplateIssue,
  type TemplateMetadata,
  type TemplatePaths,
  type TemplatePullRequest,
} from './templates.js';
import type { IssuePaths } from './io.js';

const execFileAsync = promisify(execFile);

const envSchema = z
  .object({
    GH_TOKEN: z.string().min(1, 'GH_TOKEN is required'),
    REPO: z.string().regex(/^[^/]+\/[^/]+$/, 'REPO must be in owner/repo format'),
    DEFAULT_BASE: z.string().optional(),
    LABEL_READY: z.string().optional(),
    LABEL_PLAN_PROPOSED: z.string().optional(),
    LABEL_PLAN_APPROVED: z.string().optional(),
    LABEL_IN_REVIEW: z.string().optional(),
    LABEL_LOCK: z.string().optional(),
    LABEL_READY_TO_MERGE: z.string().optional(),
  })
  .passthrough();

interface CliOptions {
  base: string;
  dryRun: boolean;
  verbose: boolean;
}

interface PRMetadata {
  number: number;
  id: number;
  url: string;
  head: string;
  base: string;
  createdAt: string;
  lastIssueSyncAt?: string;
  lastReviewSyncAt?: string;
  lastCiSyncAt?: string;
  qaCommentUrl?: string;
  qaCommentId?: number;
}

interface QACommentResult {
  url: string;
  id: number;
}

const workspaceRoot = process.cwd();

async function main() {
  const { issueNumber, options } = parseArgs(process.argv.slice(2));
  const envConfig = envSchema.parse(process.env);

  const token = envConfig.GH_TOKEN;
  const repoSlug = envConfig.REPO;
  const defaultBase = envConfig.DEFAULT_BASE ?? 'main';

  const labels = getLabelConfig(envConfig);
  const baseRef = options.base || defaultBase;
  const repo = parseRepoSlug(repoSlug);
  const octokit = createOctokit(token);

  const issue = await getIssue(octokit, repo, issueNumber).catch((error: any) => {
    if (error?.status === 404) {
      throw new Error(`Issue #${issueNumber} not found.`);
    }
    throw error;
  });

  const issueLabels = new Set((issue.labels ?? []).map((label: any) => label.name ?? label));
  if (issue.state !== 'open') {
    logInfo(`Issue #${issue.number} is ${issue.state}. Nothing to do.`);
    return;
  }

  if (issueLabels.has(labels.lock)) {
    logInfo(`Issue #${issue.number} is currently locked by another agent.`);
    return;
  }

  const slug = slugify(issue.title ?? `issue-${issue.number}`);
  const paths = getIssuePaths(workspaceRoot, issue.number, slug);

  const existingTask = await readFileIfExists(paths.task);
  const existingCosts = await readFileIfExists(paths.costs);
  const hasPlan = Boolean(await readFileIfExists(paths.plan));
  const hasQa = Boolean(await readFileIfExists(paths.qa));
  let hasTask = Boolean(existingTask);
  const hasCosts = Boolean(existingCosts);
  const needsTask = !hasTask;
  const needsCostsLedger = !hasCosts;
  let contextLinks: string[] = [];

  if (!options.dryRun) {
    await ensureIssueDirectory(paths);
    contextLinks = await collectContextRegistryLinks('.context/CONTEXT_REGISTRY.yaml', workspaceRoot);
  } else {
    logDry(`Would ensure workspace at ${paths.root}`);
  }
  let prMetadata = await readPrMetadata(paths.pr);
  let prSummary = prMetadata ? await safeGetPull(octokit, repo, prMetadata.number) : null;

  if (!prSummary && prMetadata?.head) {
    prSummary = await findPullRequestByHead(octokit, repo, prMetadata.head);
  }

  let hasConflicts = false;
  if (prSummary?.mergeableState) {
    hasConflicts = prSummary.mergeableState === 'dirty';
  }

  const issueComments = await listIssueComments(octokit, repo, issue.number);

  const stateResult = determineState({
    issueOpen: issue.state === 'open',
    hasTask,
    hasPlan,
    hasQa,
    labels: issueLabels,
    hasConflicts,
    hasPr: Boolean(prSummary),
    readyLabel: labels.ready,
    planProposedLabel: labels.planProposed,
    planApprovedLabel: labels.planApproved,
    inReviewLabel: labels.inReview,
    readyToMergeLabel: labels.readyToMerge,
    readyForAgentLabel: labels.ready,
  });

  logInfo(`State machine selected "${stateResult.state}" (${stateResult.reason}).`);

  if (!options.dryRun && needsCostsLedger && stateResult.state !== 'bootstrap') {
    await ensureCostsLedger(paths.costs);
  }

  let lockApplied = false;

  try {
    if (!options.dryRun) {
      await addIssueLabels(octokit, repo, issue.number, [labels.lock]);
      lockApplied = true;
    } else {
      logDry(`Would add label ${labels.lock}`);
    }

    switch (stateResult.state) {
      case 'bootstrap':
        await handleBootstrap({
          issue,
          repo,
          octokit,
          baseRef,
          slug,
          paths,
          dryRun: options.dryRun,
          labels,
          issueComments,
          issueLabels: Array.from(issueLabels),
          hasTask,
          hasPlan,
          hasQa,
          hasConflicts,
          prSummary,
          prMetadata,
          contextLinks,
          needsTask,
          needsCostsLedger,
        });
        break;
      case 'plan-proposed':
        ({ prMetadata, prSummary } = await handlePlanProposed({
          issue,
          repo,
          octokit,
          baseRef,
          slug,
          paths,
          dryRun: options.dryRun,
          labels,
          prMetadata,
          prSummary,
          issueComments,
          issueLabels: Array.from(issueLabels),
          hasTask,
          hasPlan,
          hasQa,
          hasConflicts,
          contextLinks,
        }));
        break;
      case 'implementation':
        ({ prMetadata, prSummary } = await handleImplementation({
          issue,
          repo,
          octokit,
          paths,
          dryRun: options.dryRun,
          labels,
          prMetadata,
          prSummary,
          issueComments,
          issueLabels: Array.from(issueLabels),
          hasTask,
          hasPlan,
          hasQa,
          hasConflicts,
          contextLinks,
        }));
        break;
      case 'in-review':
        ({ prMetadata } = await handleInReview({
          issue,
          repo,
          octokit,
          paths,
          dryRun: options.dryRun,
          labels,
          prMetadata,
          prSummary,
          issueComments,
          issueLabels: Array.from(issueLabels),
          hasTask,
          hasPlan,
          hasQa,
          hasConflicts,
          contextLinks,
        }));
        break;
      case 'conflict':
        await handleConflict({
          issue,
          paths,
          prSummary,
          dryRun: options.dryRun,
          issueComments,
          issueLabels: Array.from(issueLabels),
          hasTask,
          hasPlan,
          hasQa,
          hasConflicts,
          prMetadata,
          contextLinks,
        });
        break;
      case 'ready-to-merge':
        await handleReadyToMerge({
          issue,
          repo,
          octokit,
          paths,
          dryRun: options.dryRun,
          labels,
          prMetadata,
          prSummary,
          issueComments,
          issueLabels: Array.from(issueLabels),
          hasTask,
          hasPlan,
          hasQa,
          hasConflicts,
          contextLinks,
        });
        break;
      case 'idle':
      default:
        await renderAndWriteTaskTemplate(
          'idle',
          {
            issue,
            issueLabels: Array.from(issueLabels),
            paths,
            prSummary,
            prMetadata,
            comments: issueComments,
            hasTask: options.dryRun ? hasTask : true,
            hasPlan,
            hasQa,
            hasConflicts,
            dryRun: options.dryRun,
            extras: { contextLinks },
          },
          paths,
          { dryRun: options.dryRun, writeTask: true },
        );
        logInfo('No actionable state; exiting.');
        break;
    }
  } finally {
    if (lockApplied) {
      if (!options.dryRun) {
        await removeIssueLabel(octokit, repo, issue.number, labels.lock);
      } else {
        logDry(`Would remove label ${labels.lock}`);
      }
    }
  }
}

async function handleBootstrap({
  issue,
  repo,
  octokit,
  baseRef,
  slug,
  paths,
  dryRun,
  labels,
  issueComments,
  issueLabels,
  hasTask,
  hasPlan,
  hasQa,
  hasConflicts,
  prSummary,
  prMetadata,
  contextLinks,
  needsTask,
  needsCostsLedger,
}: any) {
  const branch = branchName(issue.number, slug);
  await ensureGitBranch(branch, baseRef, { dryRun });

  const finalHasTask = dryRun ? hasTask : true;
  const { wrote } = await renderAndWriteTaskTemplate(
    'bootstrap',
    {
      issue,
      issueLabels,
      paths,
      prSummary,
      prMetadata,
      comments: issueComments,
      hasTask: finalHasTask,
      hasPlan,
      hasQa,
      hasConflicts,
      dryRun,
      extras: { contextLinks },
    },
    paths,
    { dryRun, writeTask: true },
  );

  if (!dryRun && needsCostsLedger) {
    await ensureCostsLedger(paths.costs);
  } else if (dryRun && needsCostsLedger) {
    logDry(`Would scaffold ${paths.costs}`);
  }

  const taskCommitted =
    wrote && (await commitIfChanged(paths.task, taskCommitMessage('bootstrap', issue.number), { dryRun }));
  if (taskCommitted) {
    await pushBranch(branch, { dryRun });
  }

  if (!issue.labels?.some((label: any) => (label.name ?? label) === labels.ready)) {
    logInfo(`Issue #${issue.number} missing ${labels.ready}; ensure maintainers add it when ready.`);
  }

  logInfo(`Bootstrap complete. Open ${paths.task} and prepare PLAN.md.`);
}

async function handlePlanProposed({
  issue,
  repo,
  octokit,
  baseRef,
  slug,
  paths,
  dryRun,
  labels,
  prMetadata,
  prSummary,
  issueComments,
  issueLabels,
  hasTask,
  hasPlan,
  hasQa,
  hasConflicts,
  contextLinks,
}: any) {
  const branch = branchName(issue.number, slug);
  await ensureGitBranch(branch, baseRef, { dryRun });

  if (!prSummary) {
    if (dryRun) {
      logDry(`Would create draft PR from ${branch} into ${baseRef}`);
    } else {
      prSummary = await createDraftPullRequest(octokit, repo, {
        title: `Issue #${issue.number}: ${issue.title}`,
        body: `Automated agent flow for issue #${issue.number}.`,
        head: branch,
        base: baseRef,
        draft: true,
      });
      logInfo(`Created draft PR #${prSummary.number}: ${prSummary.url}`);
    }
  }

  if (prSummary) {
    prMetadata = await updatePrMetadata(paths.pr, prMetadata, prSummary, { dryRun });
  }

  const newComments = filterCommentsSince(issueComments, prMetadata?.lastIssueSyncAt);

  const { wrote } = await renderAndWriteTaskTemplate(
    'plan-proposed',
    {
      issue,
      issueLabels,
      paths,
      prSummary,
      prMetadata,
      comments: newComments,
      hasTask: dryRun ? hasTask : true,
      hasPlan,
      hasQa,
      hasConflicts,
      dryRun,
      extras: { contextLinks },
    },
    paths,
    { dryRun, writeTask: true },
  );
  if (wrote) {
    const committed = await commitIfChanged(paths.task, taskCommitMessage('plan-proposed', issue.number), { dryRun });
    if (committed) {
      await pushBranch(branch, { dryRun });
    }
  }

  const planCommitted = await commitIfChanged(paths.plan, `docs: add PLAN for issue #${issue.number}`, {
    dryRun,
  });
  if (planCommitted) {
    await pushBranch(branch, { dryRun });
  }

  await withDryRun(
    dryRun,
    `Add label ${labels.planProposed}`,
    () => addIssueLabels(octokit, repo, issue.number, [labels.planProposed]),
  );

  if (newComments.length && prSummary) {
    prMetadata = await updatePrMetadata(
      paths.pr,
      { ...prMetadata, lastIssueSyncAt: newComments.at(-1)?.updated_at },
      prSummary,
      { dryRun },
    );
  }

  if (prSummary) {
    await withDryRun(
      dryRun,
      'Post PR comment for plan readiness',
      () => postPRComment(octokit, repo, prSummary.number, 'Plan ready for review: see `PLAN.md`.'),
    );
  }

  return { prMetadata, prSummary };
}

async function handleImplementation({
  issue,
  repo,
  octokit,
  paths,
  dryRun,
  labels,
  prMetadata,
  prSummary,
  issueComments,
  issueLabels,
  hasTask,
  hasPlan,
  hasQa,
  hasConflicts,
  contextLinks,
}: any) {
  if (!prSummary && prMetadata) {
    prSummary = await safeGetPull(octokit, repo, prMetadata.number);
  }
  if (!prSummary) {
    await renderAndWriteTaskTemplate(
      'implementation',
      {
        issue,
        issueLabels,
        paths,
        prSummary: null,
        prMetadata,
        comments: issueComments,
        hasTask: dryRun ? hasTask : true,
        hasPlan,
        hasQa,
        hasConflicts,
        dryRun,
        extras: { contextLinks },
      },
      paths,
      { dryRun, writeTask: true },
    );
    logInfo('No PR found; implementation stage requires a PR. Skipping.');
    return { prMetadata, prSummary };
  }

  const branch = prSummary.headRef;
  await ensureGitBranch(branch, prSummary.baseRef, { dryRun });

  let qaCreated = false;
  let qaPresent = hasQa;
  if (!dryRun) {
    qaCreated = await ensureScaffold(paths.qa, 'QA Checklist', '- [ ] Add QA notes');
  } else {
    logDry('Would scaffold qa.md');
  }
  if (qaCreated) {
    const qaCommitted = await commitIfChanged(paths.qa, `docs: scaffold QA checklist for issue #${issue.number}`, {
      dryRun,
    });
    if (qaCommitted) {
      await pushBranch(branch, { dryRun });
    }
    qaPresent = true;
  }

  const unpushed = await hasUnpushedCommits(branch);
  if (unpushed) {
    await pushBranch(branch, { dryRun });
    if (prSummary.draft) {
      await withDryRun(dryRun, 'Mark PR ready for review', () =>
        markPrReadyForReview(octokit, repo, prSummary!.number),
      );
    }
    await withDryRun(
      dryRun,
      `Apply label ${labels.inReview}`,
      () => addPullRequestLabels(octokit, repo, prSummary!.number, [labels.inReview]),
    );
  }

  const qaBody = (await readFileIfExists(paths.qa)) ?? '';
  if (qaBody.trim().length && !prMetadata?.qaCommentId) {
    const qaComment = await withDryRunReturning(dryRun, 'Post QA checklist comment', async () => {
      const comment = await postPRComment(
        octokit,
        repo,
        prSummary!.number,
        ['## QA Checklist', '', qaBody.trim()].join('\n'),
      );
      return { url: comment.html_url, id: comment.id } as QACommentResult;
    });
    if (qaComment) {
      prMetadata = await updatePrMetadata(
        paths.pr,
        { ...prMetadata, qaCommentUrl: qaComment.url, qaCommentId: qaComment.id },
        prSummary,
        { dryRun },
      );
    }
  }

  const ciNotes = await collectCiFailures(octokit, repo, prSummary);
  const { wrote } = await renderAndWriteTaskTemplate(
    'implementation',
    {
      issue,
      issueLabels,
      paths,
      prSummary,
      prMetadata,
      comments: issueComments,
      hasTask: dryRun ? hasTask : true,
      hasPlan,
      hasQa: qaPresent,
      hasConflicts,
      dryRun,
      extras: {
        ciNotes,
        qaCommentUrl: prMetadata?.qaCommentUrl ?? null,
        contextLinks,
      },
    },
    paths,
    { dryRun, writeTask: true },
  );
  if (wrote) {
    const committed = await commitIfChanged(paths.task, taskCommitMessage('implementation', issue.number), { dryRun });
    if (committed) {
      await pushBranch(branch, { dryRun });
    }
  }

  return { prMetadata };
}

async function handleInReview({
  issue,
  repo,
  octokit,
  paths,
  dryRun,
  prMetadata,
  prSummary,
  issueComments,
  issueLabels,
  hasTask,
  hasPlan,
  hasQa,
  hasConflicts,
  contextLinks,
}: any) {
  if (!prSummary && prMetadata) {
    prSummary = await safeGetPull(octokit, repo, prMetadata.number);
  }
  if (!prSummary) {
    await renderAndWriteTaskTemplate(
      'in-review',
      {
        issue,
        issueLabels,
        paths,
        prSummary: null,
        prMetadata,
        comments: issueComments,
        hasTask: dryRun ? hasTask : true,
        hasPlan,
        hasQa,
        hasConflicts,
        dryRun,
        extras: { contextLinks },
      },
      paths,
      { dryRun, writeTask: true },
    );
    logInfo('PR not found; cannot sync review feedback.');
    return { prMetadata };
  }
  const branch = prSummary.headRef;
  await ensureGitBranch(branch, prSummary.baseRef, { dryRun });

  const reviewComments = await listReviewComments(octokit, repo, prSummary.number, {
    since: prMetadata?.lastReviewSyncAt,
  });

  const reviews = await listReviews(octokit, repo, prSummary.number, {
    since: prMetadata?.lastReviewSyncAt,
  });
  const ciNotes = await collectCiFailures(octokit, repo, prSummary);
  const combinedComments = [...issueComments, ...reviewComments, ...reviews];
  const { wrote } = await renderAndWriteTaskTemplate(
    'in-review',
    {
      issue,
      issueLabels,
      paths,
      prSummary,
      prMetadata,
      comments: combinedComments,
      hasTask: dryRun ? hasTask : true,
      hasPlan,
      hasQa,
      hasConflicts,
      dryRun,
      extras: { ciNotes, contextLinks },
    },
    paths,
    { dryRun, writeTask: true },
  );
  if (wrote) {
    const committed = await commitIfChanged(paths.task, taskCommitMessage('in-review', issue.number), { dryRun });
    if (committed) {
      await pushBranch(branch, { dryRun });
    }
  }

  if ((reviewComments.length || reviews.length) && prSummary) {
    prMetadata = await updatePrMetadata(
      paths.pr,
      {
        ...prMetadata,
        lastReviewSyncAt:
          reviewComments.at(-1)?.updated_at ?? reviews.at(-1)?.submitted_at ?? prMetadata?.lastReviewSyncAt,
      },
      prSummary,
      { dryRun },
    );
  }

  return { prMetadata };
}

async function handleConflict({
  issue,
  paths,
  prSummary,
  dryRun,
  issueComments,
  issueLabels,
  hasTask,
  hasPlan,
  hasQa,
  hasConflicts,
  prMetadata,
  contextLinks,
}: any) {
  if (!prSummary) {
    await renderAndWriteTaskTemplate(
      'conflict',
      {
        issue,
        issueLabels,
        paths,
        prSummary: null,
        prMetadata,
        comments: issueComments,
        hasTask: dryRun ? hasTask : true,
        hasPlan,
        hasQa,
        hasConflicts,
        dryRun,
        extras: { contextLinks },
      },
      paths,
      { dryRun, writeTask: true },
    );
    logInfo('Conflict stage reached but PR missing; nothing to record.');
    return;
  }

  await ensureGitBranch(prSummary.headRef, prSummary.baseRef, { dryRun });

  const { wrote } = await renderAndWriteTaskTemplate(
    'conflict',
    {
      issue,
      issueLabels,
      paths,
      prSummary,
      prMetadata,
      comments: issueComments,
      hasTask: dryRun ? hasTask : true,
      hasPlan,
      hasQa,
      hasConflicts: true,
      dryRun,
      extras: { contextLinks },
    },
    paths,
    { dryRun, writeTask: true },
  );
  if (wrote) {
    const committed = await commitIfChanged(paths.task, taskCommitMessage('conflict', issue.number), { dryRun });
    if (committed) {
      await pushBranch(prSummary.headRef, { dryRun });
    }
  }
}

async function handleReadyToMerge({
  issue,
  repo,
  octokit,
  paths,
  dryRun,
  labels,
  prMetadata,
  prSummary,
  issueComments,
  issueLabels,
  hasTask,
  hasPlan,
  hasQa,
  hasConflicts,
}: any) {
  if (!prSummary && prMetadata) {
    prSummary = await safeGetPull(octokit, repo, prMetadata.number);
  }
  if (!prSummary) {
    await renderAndWriteTaskTemplate(
      'ready-to-merge',
      {
        issue,
        issueLabels,
        paths,
        prSummary: null,
        prMetadata,
        comments: issueComments,
        hasTask,
        hasPlan,
        hasQa,
        hasConflicts,
        dryRun,
        extras: { contextLinks },
      },
      paths,
      { dryRun, writeTask: true },
    );
    logInfo('Ready-to-merge stage reached but PR missing.');
    return;
  }

  const branch = prSummary.headRef;
  await ensureGitBranch(branch, prSummary.baseRef, { dryRun });

  const entries = await readCostEntries(paths.root);
  const totals = sumCosts(entries);
  const costSummary = {
    totalTokens: totals.totalTokens,
    totalUSD: totals.totalUSD.toFixed(2),
  };

  const { wrote } = await renderAndWriteTaskTemplate(
    'ready-to-merge',
    {
      issue,
      issueLabels,
      paths,
      prSummary,
      prMetadata,
      comments: issueComments,
      hasTask: dryRun ? hasTask : true,
      hasPlan,
      hasQa,
      hasConflicts,
      dryRun,
      extras: { costSummary, contextLinks },
    },
    paths,
    { dryRun, writeTask: true },
  );
  if (wrote) {
    const committed = await commitIfChanged(paths.task, taskCommitMessage('ready-to-merge', issue.number), { dryRun });
    if (committed) {
      await pushBranch(branch, { dryRun });
    }
  }

  const totalLine = formatTotalLine(totals);
  await withDryRun(dryRun, 'Append TOTAL to costs.md', async () => {
    const file = path.join(paths.root, COSTS_FILENAME);
    const content = (await readFileIfExists(file)) ?? '';
    if (!content.includes(totalLine)) {
      await fs.appendFile(file, totalLine + '\n', 'utf8');
    }
  });

  const qaLink = prMetadata?.qaCommentUrl
    ? `- QA Checklist: ${prMetadata.qaCommentUrl}`
    : '- QA Checklist: _not posted_';

  const summaryComment = [
    `## Ready to Merge Summary`,
    '',
    `- PR: [#${prSummary.number}](${prSummary.url})`,
    `- Commits: ${prSummary.commits}`,
    `- Tests: refer to latest CI runs`,
    `- Total tokens: ${totals.totalTokens}`,
    `- Total cost (USD): ${totals.totalUSD.toFixed(2)}`,
    qaLink,
  ].join('\n');

  await withDryRun(dryRun, 'Post final issue summary', () =>
    postIssueComment(octokit, repo, issue.number, summaryComment),
  );

  const issueDirRelative = path.relative(workspaceRoot, paths.root);

  await withDryRun(dryRun, `Remove ${issueDirRelative} from branch`, async () => {
    await fs.rm(paths.root, { recursive: true, force: true });
  });

  await commitAll(`chore: cleanup ${issueDirRelative} before merge`, { dryRun });
  await pushBranch(branch, { dryRun });

  await withDryRun(dryRun, 'Merge pull request', () =>
    mergePullRequest(octokit, repo, prSummary!.number, `chore: merge issue #${issue.number}`),
  );

  await withDryRun(dryRun, 'Delete remote branch', () => deleteBranch(octokit, repo, branch));

  const labelsToRemove = [
    labels.planProposed,
    labels.planApproved,
    labels.inReview,
    labels.readyToMerge,
    labels.lock,
  ];

  for (const label of labelsToRemove) {
    await withDryRun(dryRun, `Remove label ${label}`, () => removeIssueLabel(octokit, repo, issue.number, label));
  }
}

async function pushBranch(branch: string, options: { dryRun: boolean }) {
  await withDryRun(options.dryRun, `Push branch ${branch}`, () => runGit(['push', '--set-upstream', 'origin', branch]));
}

async function commitIfChanged(filePath: string, message: string, options: { dryRun: boolean }): Promise<boolean> {
  const relative = path.relative(workspaceRoot, filePath);
  const status = await gitStatus(relative);
  if (!status.includes(relative)) return false;
  await withDryRun(options.dryRun, `Commit ${relative}`, async () => {
    await runGit(['add', relative]);
    await runGit(['commit', '-m', message]);
  });
  return true;
}

async function commitAll(message: string, options: { dryRun: boolean }) {
  const status = await gitStatus();
  if (!status.trim()) return;
  await withDryRun(options.dryRun, `Commit all changes (${message})`, async () => {
    await runGit(['add', '-A']);
    await runGit(['commit', '-m', message]);
  });
}

async function ensureGitBranch(branch: string, base: string, options: { dryRun: boolean }) {
  const current = await runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (current.trim() === branch) {
    logInfo(`On branch ${branch}.`);
    return;
  }

  const exists = await branchExists(branch);

  if (!exists) {
    await withDryRun(options.dryRun, `Create branch ${branch} from ${base}`, async () => {
      await runGit(['fetch', 'origin', base]);
      await runGit(['checkout', '-b', branch, `origin/${base}`]);
    });
  } else {
    await withDryRun(options.dryRun, `Switch to branch ${branch}`, () => runGit(['checkout', branch]));
  }
}

async function branchExists(branch: string): Promise<boolean> {
  try {
    await runGit(['rev-parse', '--verify', branch]);
    return true;
  } catch {
    return false;
  }
}

async function withDryRun<T>(dryRun: boolean, description: string, fn: () => Promise<T>): Promise<T | void> {
  if (dryRun) {
    logDry(description);
    return;
  }
  return await fn();
}

async function withDryRunReturning<T>(
  dryRun: boolean,
  description: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  if (dryRun) {
    logDry(description);
    return null;
  }
  return await fn();
}

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: workspaceRoot });
  return stdout;
}

async function gitStatus(target?: string): Promise<string> {
  const args = ['status', '--short'];
  if (target) args.push(target);
  try {
    return await runGit(args);
  } catch {
    return '';
  }
}

async function hasUnpushedCommits(branch: string): Promise<boolean> {
  try {
    await runGit(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`]);
  } catch {
    // No upstream; treat as unpushed.
    const log = await runGit(['log', '--oneline']);
    return log.trim().length > 0;
  }

  const diff = await runGit(['rev-list', '--left-right', '--count', `${branch}@{upstream}...${branch}`]);
  const [behind, ahead] = diff.trim().split(/\s+/).map(Number);
  return (ahead ?? 0) > 0;
}

async function updatePrMetadata(
  filePath: string,
  metadata: PRMetadata | null,
  summary: any,
  options: { dryRun: boolean },
): Promise<PRMetadata> {
  const next: PRMetadata = {
    ...(metadata ?? {
      number: summary.number,
      url: summary.url,
      head: summary.headRef,
      base: summary.baseRef,
      createdAt: new Date().toISOString(),
    }),
    number: summary.number,
    id: summary.id ?? metadata?.id ?? 0,
    url: summary.url,
    head: summary.headRef,
    base: summary.baseRef,
  };
  if (!options.dryRun) {
    await writeJsonFile(filePath, next);
  } else {
    logDry(`Would update ${filePath}`);
  }
  return next;
}

async function readPrMetadata(filePath: string): Promise<PRMetadata | null> {
  const raw = await readFileIfExists(filePath);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PRMetadata;
  } catch (error: any) {
    logWarn(`Unable to parse ${filePath}: ${error.message}`);
    return null;
  }
}

async function safeGetPull(octokit: any, repo: any, prNumber: number) {
  try {
    return await getPullRequest(octokit, repo, prNumber);
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function collectCiFailures(octokit: any, repo: any, prSummary: any): Promise<string[]> {
  const runs = await listWorkflowRunsForPullRequest(octokit, repo, prSummary.number);
  const failingRuns = runs.filter((run: any) => run.conclusion === 'failure' || run.status === 'failed');
  const notes: string[] = [];

  for (const run of failingRuns) {
    const jobs = await listJobsForWorkflowRun(octokit, repo, run.id);
    const failingJobs = jobs.filter((job: any) => job.conclusion === 'failure');
    if (!failingJobs.length) continue;
    notes.push(`- Workflow **${run.name}** failed: ${run.html_url}`);
    for (const job of failingJobs) {
      notes.push(`  - Job **${job.name}** failed: ${job.html_url}`);
    }
  }

  const checks = await listChecksForRef(octokit, repo, prSummary.headSha);
  for (const check of checks) {
    if (check.conclusion === 'failure') {
      notes.push(`- Check **${check.name}** failed: ${check.details_url ?? 'no details'}`);
    }
  }

  return Array.from(new Set(notes));
}

type StateLogParams = {
  issue: any;
  issueLabels: string[];
  paths: IssuePaths;
  prSummary?: any | null;
  prMetadata?: PRMetadata | null;
  comments?: any[];
  hasTask: boolean;
  hasPlan: boolean;
  hasQa: boolean;
  hasConflicts: boolean;
  dryRun: boolean;
  extras?: Record<string, unknown>;
};

const MAX_TEMPLATE_COMMENTS = 10;

async function renderStateSummary(state: string, params: StateLogParams): Promise<string> {
  const model = buildStateTemplateModel(params);
  return await renderStateTemplate(state, model);
}

interface RenderOptions {
  dryRun: boolean;
  writeTask?: boolean;
}

async function renderAndWriteTaskTemplate(
  state: string,
  params: StateLogParams,
  paths: IssuePaths,
  options: RenderOptions,
): Promise<{ summary: string; wrote: boolean }> {
  try {
    const summary = await renderStateSummary(state, params);
    logInfo(summary.trimEnd());

    let wrote = false;
    const shouldWrite = options.writeTask ?? true;
    if (shouldWrite) {
      if (options.dryRun) {
        logDry(`Would update ${paths.task} from "${state}" template`);
      } else {
        wrote = await ensureTaskFile(paths, summary);
      }
    }

    return { summary, wrote };
  } catch (error: any) {
    logWarn(`Failed to render template for state "${state}": ${error?.message ?? error}`);
    return { summary: '', wrote: false };
  }
}

function buildStateTemplateModel(params: StateLogParams): StateTemplateModel {
  const issueModel = toTemplateIssue(params.issue);
  const commentModels = toTemplateComments(params.comments);
  const prModel = params.prSummary ? toTemplatePullRequest(params.prSummary) : null;
  const metadataModel = params.prMetadata ? toTemplateMetadata(params.prMetadata) : null;
  const pathsModel = toTemplatePaths(params.paths);

  return {
    issue: issueModel,
    labels: params.issueLabels,
    comments: commentModels,
    pr: prModel,
    metadata: metadataModel,
    paths: pathsModel,
    flags: {
      hasTask: params.hasTask,
      hasPlan: params.hasPlan,
      hasQa: params.hasQa,
      hasConflicts: params.hasConflicts,
      hasPr: Boolean(params.prSummary),
      dryRun: params.dryRun,
    },
    extras: params.extras,
  };
}

function toTemplateIssue(issue: any): TemplateIssue {
  const body = typeof issue?.body === 'string' ? issue.body : '';
  const url = issue?.html_url ?? issue?.url ?? '';
  const state = issue?.state ?? 'unknown';
  const title = issue?.title ?? 'Untitled Issue';
  const snippet = truncateText(sanitizeForMarkdown(body), 320);

  return {
    number: issue?.number ?? 0,
    title,
    url,
    state,
    body,
    bodySnippet: snippet,
  };
}

function toTemplateComments(rawComments?: any[]): TemplateComment[] {
  if (!Array.isArray(rawComments)) return [];
  const trimmed =
    rawComments.length > MAX_TEMPLATE_COMMENTS
      ? rawComments.slice(-MAX_TEMPLATE_COMMENTS)
      : rawComments.slice();

  return trimmed.map((comment: any) => {
    const body = typeof comment?.body === 'string' ? comment.body : '';
    const updatedAt = comment?.updated_at ?? comment?.submitted_at ?? comment?.created_at ?? 'unknown';
    const author = comment?.user?.login ?? comment?.author ?? 'unknown';
    const url = comment?.html_url ?? comment?.url ?? '';
    return {
      id: comment?.id ?? 0,
      author,
      url,
      updatedAt,
      body,
      bodySnippet: truncateText(sanitizeForMarkdown(body), 200),
    };
  });
}

function toTemplatePullRequest(pr: any): TemplatePullRequest {
  return {
    number: pr?.number ?? 0,
    url: pr?.html_url ?? pr?.url ?? '',
    state: pr?.state ?? 'unknown',
    headRef: pr?.headRef ?? pr?.head?.ref ?? 'unknown',
    baseRef: pr?.baseRef ?? pr?.base?.ref ?? 'unknown',
    isDraft: Boolean(pr?.isDraft ?? pr?.draft),
    mergeableState: pr?.mergeableState ?? pr?.mergeable_state ?? undefined,
    commits: typeof pr?.commits === 'number' ? pr.commits : undefined,
    createdAt: pr?.createdAt ?? pr?.created_at ?? undefined,
  };
}

function toTemplateMetadata(metadata: PRMetadata): TemplateMetadata {
  return {
    number: metadata?.number,
    url: metadata?.url,
    head: metadata?.head,
    base: metadata?.base,
    lastIssueSyncAt: metadata?.lastIssueSyncAt,
    lastReviewSyncAt: metadata?.lastReviewSyncAt,
    lastCiSyncAt: metadata?.lastCiSyncAt,
    qaCommentUrl: metadata?.qaCommentUrl,
  };
}

function toTemplatePaths(paths: IssuePaths): TemplatePaths {
  return {
    root: relativeToWorkspace(paths.root),
    task: relativeToWorkspace(paths.task),
    plan: relativeToWorkspace(paths.plan),
    qa: relativeToWorkspace(paths.qa),
    pr: relativeToWorkspace(paths.pr),
    costs: relativeToWorkspace(paths.costs),
  };
}

function relativeToWorkspace(targetPath: string): string {
  const relative = path.relative(workspaceRoot, targetPath);
  return relative || targetPath;
}

function truncateText(input: string, maxLength: number): string {
  const normalized = input.trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function filterCommentsSince(comments: any[], since?: string | null): any[] {
  if (!Array.isArray(comments) || !since) {
    return Array.isArray(comments) ? comments : [];
  }
  return comments.filter((comment) => {
    const timestamp = comment?.updated_at ?? comment?.created_at ?? comment?.submitted_at;
    if (!timestamp) return true;
    return timestamp > since;
  });
}

function taskCommitMessage(state: string, issueNumber: number): string {
  switch (state) {
    case 'bootstrap':
      return `chore: bootstrap issue #${issueNumber}`;
    case 'plan-proposed':
      return `docs: refresh task for plan stage #${issueNumber}`;
    case 'implementation':
      return `docs: refresh task for implementation stage #${issueNumber}`;
    case 'in-review':
      return `docs: refresh task for review stage #${issueNumber}`;
    case 'conflict':
      return `docs: refresh task for conflict state #${issueNumber}`;
    case 'ready-to-merge':
      return `docs: refresh task for ready-to-merge #${issueNumber}`;
    case 'idle':
    default:
      return `docs: refresh task for issue #${issueNumber}`;
  }
}

function branchName(issueNumber: number, slug: string): string {
  return `issues/${issueNumber}-${slug}`;
}

function parseArgs(argv: string[]): { issueNumber: number; options: CliOptions } {
  if (!argv.length) {
    usage();
  }
  let base = '';
  let dryRun = false;
  let verbose = false;
  const rest: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--base':
        base = argv[++i] ?? '';
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--verbose':
        verbose = true;
        break;
      default:
        rest.push(arg);
        break;
    }
  }

  if (!rest.length) {
    usage();
  }

  const issueNumber = Number(rest[0]);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error(`Issue number must be a positive integer (received ${rest[0]}).`);
  }

  return { issueNumber, options: { base, dryRun, verbose } };
}

function usage(): never {
  console.error('Usage: pnpm agent <issueNumber> [--base <branch>] [--dry-run] [--verbose]');
  process.exit(1);
}

function getLabelConfig(env: Partial<Record<string, string | undefined>>) {
  return {
    ready: env.LABEL_READY ?? 'ready-for-agent',
    planProposed: env.LABEL_PLAN_PROPOSED ?? 'plan-proposed',
    planApproved: env.LABEL_PLAN_APPROVED ?? 'plan-approved',
    inReview: env.LABEL_IN_REVIEW ?? 'in-review',
    lock: env.LABEL_LOCK ?? 'agent:locked',
    readyToMerge: env.LABEL_READY_TO_MERGE ?? 'ready-to-merge',
  };
}

function sanitizeForMarkdown(input: string): string {
  return input.replace(/\r?\n/g, ' ').trim();
}

function logInfo(message: string) {
  console.log(`[agent] ${message}`);
}

function logWarn(message: string) {
  console.warn(`[agent:warn] ${message}`);
}

function logDry(message: string) {
  console.log(`[agent:dry] ${message}`);
}

main().catch((error) => {
  console.error(`[agent:error] ${error.stack ?? error}`);
  process.exit(1);
});
