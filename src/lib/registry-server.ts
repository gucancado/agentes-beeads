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

/**
 * Zera o cache em memória do registry. Use após editar agents.yml
 * (o arquivo em disco pode estar stale até o próximo deploy do Coolify,
 * mas pelo menos não devolveremos o valor antigo cacheado).
 *
 * Nota: a edição via `agents-yml-writer` commita no repo e dispara
 * auto-deploy do Coolify (~90s); até lá, o arquivo em disco do container
 * atual continua o antigo. Pra ler a versão recém-salva sem esperar,
 * vamos retornar o estado em-memória explicitamente do server action.
 */
export function invalidateRegistry(): void {
  cached = null;
}
