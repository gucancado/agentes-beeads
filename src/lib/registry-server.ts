import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAgentsYaml, type Registry } from './registry';

let cached: Registry | null = null;

export function loadRegistry(): Registry {
  if (cached) return cached;
  const path = join(process.cwd(), 'agents.yml');
  const source = readFileSync(path, 'utf8');
  cached = parseAgentsYaml(source);
  return cached;
}
