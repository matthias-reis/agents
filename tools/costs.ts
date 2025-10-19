import { promises as fs } from 'fs';
import path from 'path';

export const COSTS_FILENAME = 'costs.md';

export interface CostEntry {
  timestamp: string;
  provider: string;
  model: string;
  input: number;
  output: number;
  total: number;
  estUSD: number;
  raw?: string;
  extras?: Record<string, string>;
}

export interface CostTotals {
  totalTokens: number;
  totalUSD: number;
}

export async function appendCostEntry(issueDir: string, entry: CostEntry): Promise<void> {
  const filePath = path.join(issueDir, COSTS_FILENAME);
  const line = formatCostEntry(entry);
  await fs.mkdir(issueDir, { recursive: true });
  await fs.appendFile(filePath, line + '\n', 'utf8');
}

export async function readCostEntries(issueDir: string): Promise<CostEntry[]> {
  const filePath = path.join(issueDir, COSTS_FILENAME);
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (err: any) {
    if (err?.code === 'ENOENT') return [];
    throw err;
  }

  const entries: CostEntry[] = [];

  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith('- ')) continue;
    if (line.includes('TOTAL')) continue;
    const parsed = parseCostLine(line);
    if (parsed) entries.push(parsed);
  }

  return entries;
}

export function sumCosts(entries: CostEntry[]): CostTotals {
  return entries.reduce<CostTotals>(
    (acc, entry) => ({
      totalTokens: acc.totalTokens + (entry.total || 0),
      totalUSD: acc.totalUSD + (entry.estUSD || 0),
    }),
    { totalTokens: 0, totalUSD: 0 },
  );
}

export function formatTotalLine(totals: CostTotals): string {
  return `- TOTAL | tokens=${totals.totalTokens} | estUSD=${totals.totalUSD.toFixed(2)}`;
}

function formatCostEntry(entry: CostEntry): string {
  const baseFields = [
    entry.timestamp,
    `provider=${entry.provider}`,
    `model=${entry.model}`,
    `input=${entry.input}`,
    `output=${entry.output}`,
    `total=${entry.total}`,
    `estUSD=${entry.estUSD}`,
  ];

  const extraSegments =
    entry.extras && Object.keys(entry.extras).length
      ? Object.entries(entry.extras).map(([key, value]) => `${key}=${value}`)
      : [];

  return `- ${[...baseFields, ...extraSegments].join(' | ')}`;
}

function parseCostLine(line: string): CostEntry | null {
  const parts = line.slice(2).split('|').map((s) => s.trim());
  if (!parts.length) return null;
  const timestamp = parts[0];
  const extras: Record<string, string> = {};
  let provider = '';
  let model = '';
  let input = 0;
  let output = 0;
  let total = 0;
  let estUSD = 0;

  for (let i = 1; i < parts.length; i++) {
    const [key, rawValue] = parts[i].split('=').map((s) => s.trim());
    if (!key || rawValue === undefined) continue;
    switch (key) {
      case 'provider':
        provider = rawValue;
        break;
      case 'model':
        model = rawValue;
        break;
      case 'input':
        input = Number(rawValue);
        break;
      case 'output':
        output = Number(rawValue);
        break;
      case 'total':
        total = Number(rawValue);
        break;
      case 'estUSD':
        estUSD = Number(rawValue);
        break;
      default:
        extras[key] = rawValue;
        break;
    }
  }

  return {
    timestamp,
    provider,
    model,
    input,
    output,
    total,
    estUSD,
    extras: Object.keys(extras).length ? extras : undefined,
    raw: line,
  };
}
