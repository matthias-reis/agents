import { promises as fs } from 'fs';
import path from 'path';
import { renderTaskTemplate, TaskTemplateIssue } from './templates.js';

export interface IssuePaths {
  root: string;
  task: string;
  plan: string;
  qa: string;
  pr: string;
  costs: string;
}

export interface IssueSnapshot {
  number: number;
  title: string;
  body?: string | null;
  url: string;
  state: string;
  labels: string[];
}

export interface TaskTemplateOptions {
  contextLinks?: string[];
}

export interface AppendOptions {
  heading: string;
  entries: string[];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .substring(0, 80) || `issue`;
}

export function getIssuePaths(workspaceRoot: string, issueNumber: number, slug: string): IssuePaths {
  const dir = path.join(workspaceRoot, 'issues', `${issueNumber}-${slug}`);
  return {
    root: dir,
    task: path.join(dir, 'task.md'),
    plan: path.join(dir, 'PLAN.md'),
    qa: path.join(dir, 'qa.md'),
    pr: path.join(dir, 'pr.json'),
    costs: path.join(dir, 'costs.md'),
  };
}

export async function ensureIssueDirectory(paths: IssuePaths): Promise<void> {
  await fs.mkdir(paths.root, { recursive: true });
}

export async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeFileIfChanged(filePath: string, content: string): Promise<boolean> {
  const existing = await readFileIfExists(filePath);
  if (existing === content) {
    return false;
  }
  await fs.writeFile(filePath, ensureTrailingNewline(content), 'utf8');
  return true;
}

export async function ensureJsonFile<T extends Record<string, unknown>>(
  filePath: string,
  defaultValue: T,
): Promise<T> {
  const existing = await readFileIfExists(filePath);
  if (existing) {
    try {
      return JSON.parse(existing) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON at ${filePath}: ${(error as Error).message}`);
    }
  }
  await writeJsonFile(filePath, defaultValue);
  return defaultValue;
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function ensureTaskFile(
  paths: IssuePaths,
  issue: IssueSnapshot,
  options: TaskTemplateOptions = {},
): Promise<boolean> {
  const taskIssue: TaskTemplateIssue = {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    url: issue.url,
    labels: issue.labels,
    body: issue.body ?? '',
  };
  const content = await renderTaskTemplate({
    issue: taskIssue,
    contextLinks: options.contextLinks ?? [],
  });
  return writeFileIfChanged(paths.task, content);
}

export async function appendToSection(filePath: string, options: AppendOptions): Promise<boolean> {
  const existing = (await readFileIfExists(filePath)) ?? '';
  if (!existing.includes(`## ${options.heading}`)) {
    throw new Error(`Heading "## ${options.heading}" not found in ${filePath}`);
  }
  const lines = existing.split(/\r?\n/);
  const insertedEntries = options.entries.filter(Boolean);
  if (!insertedEntries.length) return false;

  const headingIndex = lines.findIndex((line) => line.trim() === `## ${options.heading}`);
  if (headingIndex === -1) {
    throw new Error(`Unable to locate heading "## ${options.heading}" in ${filePath}`);
  }

  // Detect duplicates by checking if the exact entry already exists.
  const deduped = insertedEntries.filter((entry) => !existing.includes(entry));
  if (!deduped.length) return false;

  const insertionIndex = headingIndex + 2; // skip heading line and following blank line
  lines.splice(insertionIndex, 0, ...deduped, '');

  await fs.writeFile(filePath, ensureTrailingNewline(lines.join('\n')), 'utf8');
  return true;
}

export async function ensureScaffold(filePath: string, header: string, body = ''): Promise<boolean> {
  const template = [`# ${header}`, '', body.trim(), ''].filter(Boolean).join('\n');
  return writeFileIfChanged(filePath, template);
}

export async function ensureCostsLedger(filePath: string): Promise<boolean> {
  const template = ['# Cost Ledger', ''].join('\n');
  const existing = await readFileIfExists(filePath);
  if (existing) return false;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, template + '\n', 'utf8');
  return true;
}

export async function collectContextRegistryLinks(
  registryPath: string,
  workspaceRoot: string,
): Promise<string[]> {
  const fullPath = path.isAbsolute(registryPath) ? registryPath : path.join(workspaceRoot, registryPath);
  const content = await readFileIfExists(fullPath);
  if (!content) return [];
  const links = new Set<string>();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/[:]\s*(docs\/[A-Za-z0-9_./-]+)/);
    if (match) {
      links.add(match[1]);
    }
  }
  return Array.from(links);
}

export function ensureTrailingNewline(input: string): string {
  return input.endsWith('\n') ? input : `${input}\n`;
}
