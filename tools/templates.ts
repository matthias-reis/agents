import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { Eta } from 'eta';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const candidateRoots = [
  path.resolve(moduleDir, '..', 'templates'),
  path.resolve(process.cwd(), 'templates'),
];
const templatesRoot = candidateRoots.find((dir) => existsSync(dir)) ?? candidateRoots[0];

const renderer = new Eta({
  views: templatesRoot,
  cache: true,
  async: true,
});

export interface TaskTemplateIssue {
  number: number;
  title: string;
  state: string;
  url: string;
  labels: string[];
  body: string;
}

export interface TaskTemplateModel {
  issue: TaskTemplateIssue;
  contextLinks: string[];
}

export async function renderTaskTemplate(model: TaskTemplateModel): Promise<string> {
  const output = await renderTemplate('task', model);
  return output;
}

export interface TemplateIssue {
  number: number;
  title: string;
  url: string;
  state: string;
  body: string;
  bodySnippet: string;
}

export interface TemplateComment {
  id: number;
  author: string;
  url: string;
  updatedAt: string;
  body: string;
  bodySnippet: string;
}

export interface TemplatePullRequest {
  number: number;
  url: string;
  state: string;
  headRef: string;
  baseRef: string;
  isDraft: boolean;
  mergeableState?: string;
  commits?: number;
  createdAt?: string;
}

export interface TemplateMetadata {
  number?: number;
  url?: string;
  head?: string;
  base?: string;
  lastIssueSyncAt?: string;
  lastReviewSyncAt?: string;
  lastCiSyncAt?: string;
  qaCommentUrl?: string;
}

export interface TemplatePaths {
  root: string;
  task: string;
  plan: string;
  qa: string;
  pr: string;
  costs: string;
}

export interface TemplateFlags {
  hasTask: boolean;
  hasPlan: boolean;
  hasQa: boolean;
  hasConflicts: boolean;
  hasPr: boolean;
  dryRun: boolean;
}

export interface StateTemplateModel {
  issue: TemplateIssue;
  labels: string[];
  comments: TemplateComment[];
  pr?: TemplatePullRequest | null;
  metadata?: TemplateMetadata | null;
  paths: TemplatePaths;
  flags: TemplateFlags;
  extras?: Record<string, unknown>;
}

export async function renderStateTemplate(state: string, model: StateTemplateModel): Promise<string> {
  const templateName = `states/${state}`;
  const output = await renderTemplate(templateName, model);
  return output;
}

async function renderTemplate(templateName: string, model: unknown): Promise<string> {
  const rendered = await renderer.renderAsync(templateName, model);
  if (typeof rendered !== 'string') {
    throw new Error(`Template "${templateName}" did not render to a string.`);
  }
  return rendered;
}
