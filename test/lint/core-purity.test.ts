import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

// Guards CLAUDE.md rule 1: the lint config must reject impure code in /src/core.
// Lints virtual files against the real eslint.config.js, with type-aware rules off
// because the virtual files are not part of the TypeScript project.
const eslint = new ESLint({
  cwd: fileURLToPath(new URL('../..', import.meta.url)),
  overrideConfig: [tseslint.configs.disableTypeChecked],
});

async function ruleIdsFor(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId ?? 'fatal');
}

const CORE_FILE = 'src/core/purity-fixture.ts';
const ADAPTER_FILE = 'src/adapters/purity-fixture.ts';

describe('core purity lint rule', () => {
  it.each([
    ["import { Client } from 'discord.js';\nexport const c = Client;", 'no-restricted-imports'],
    ["import { joinVoiceChannel } from '@discordjs/voice';\nexport const j = joinVoiceChannel;", 'no-restricted-imports'],
    ["import Redis from 'ioredis';\nexport const r = Redis;", 'no-restricted-imports'],
    ["import pino from 'pino';\nexport const p = pino;", 'no-restricted-imports'],
    ["import { setTimeout as t } from 'node:timers/promises';\nexport const x = t;", 'no-restricted-imports'],
    ['export const now = Date.now();', 'no-restricted-globals'],
    ['export const d = new Date();', 'no-restricted-globals'],
    ['setTimeout(() => undefined, 1);', 'no-restricted-globals'],
    ['export const t = performance.now();', 'no-restricted-globals'],
    ['export const e = process.env;', 'no-restricted-globals'],
    ['export const n = globalThis.Date.now();', 'no-restricted-syntax'],
  ])('rejects impure code in core: %s', async (code, expectedRule) => {
    expect(await ruleIdsFor(code, CORE_FILE)).toContain(expectedRule);
  });

  it('accepts pure code in core', async () => {
    const code = [
      'export interface Clock { now(): number }',
      'export const deadline = (clock: Clock, anchor: number): number => Math.max(clock.now(), anchor) + 300_000;',
    ].join('\n');
    expect(await ruleIdsFor(code, CORE_FILE)).toEqual([]);
  });

  it('allows I/O and time outside core', async () => {
    const code = "import { Client } from 'discord.js';\nexport const c = Client;\nexport const now = Date.now();";
    expect(await ruleIdsFor(code, ADAPTER_FILE)).toEqual([]);
  });
});
