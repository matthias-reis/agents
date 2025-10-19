export type AgentState =
  | 'bootstrap'
  | 'plan-proposed'
  | 'implementation'
  | 'in-review'
  | 'conflict'
  | 'ready-to-merge'
  | 'idle';

export interface StateContext {
  issueOpen: boolean;
  hasTask: boolean;
  hasPlan: boolean;
  hasQa: boolean;
  labels: Set<string>;
  hasConflicts: boolean;
  hasPr: boolean;
  readyLabel: string;
  planProposedLabel: string;
  planApprovedLabel: string;
  inReviewLabel: string;
  readyToMergeLabel: string;
  readyForAgentLabel: string;
}

export interface StateResult {
  state: AgentState;
  reason: string;
}

export function determineState(ctx: StateContext): StateResult {
  if (!ctx.issueOpen) {
    return { state: 'idle', reason: 'Issue is closed' };
  }

  if (ctx.labels.has(ctx.readyToMergeLabel)) {
    return { state: 'ready-to-merge', reason: `Label ${ctx.readyToMergeLabel} present` };
  }

  if (ctx.hasConflicts) {
    return { state: 'conflict', reason: 'PR has merge conflicts against base' };
  }

  if (ctx.labels.has(ctx.inReviewLabel)) {
    return { state: 'in-review', reason: `Label ${ctx.inReviewLabel} present` };
  }

  if (ctx.labels.has(ctx.planApprovedLabel)) {
    return { state: 'implementation', reason: `Label ${ctx.planApprovedLabel} present` };
  }

  if (ctx.hasPlan) {
    return { state: 'plan-proposed', reason: 'PLAN.md exists but not approved' };
  }

  if (ctx.labels.has(ctx.readyForAgentLabel)) {
    return { state: 'bootstrap', reason: `Label ${ctx.readyForAgentLabel} present` };
  }

  return { state: 'idle', reason: 'No matching state transition' };
}
