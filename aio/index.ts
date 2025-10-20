#!/usr/bin/env esrun

import dotenv from 'dotenv';
import { AIOEngine } from './src/aio-engine.js';

dotenv.config();

async function main() {
  const issueId = process.argv[2];
  
  if (!issueId) {
    console.error('Usage: pnpm aio {issue id}');
    process.exit(1);
  }

  const engine = new AIOEngine();
  await engine.run(issueId);
}

main().catch(console.error);