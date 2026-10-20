import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../../src/app/config.js';

const ID_A = '123456789012345678';
const ID_B = '876543210987654321';

describe('loadConfig', () => {
  it('applies documented defaults when the environment is empty', () => {
    const config = loadConfig({});
    expect(config.behavior).toEqual({
      silenceThresholdSeconds: 300,
      minHumans: 2,
      switchMargin: 2,
      electionStableSeconds: 20,
      minDwellSeconds: 60,
      graceSeconds: 0,
      noticeCoalesceMs: 2000,
      exemptStreaming: true,
      exemptCamera: true,
      exemptRoleIds: [],
      ignoredChannelIds: [],
      dryRun: true,
    });
    expect(config.infra).toEqual({
      redisUrl: 'redis://localhost:6379',
      stateTtlSeconds: 86400,
      metricsPort: 9464,
      logLevel: 'info',
    });
    expect(config.ai.decisionPolicy).toBe('rules');
    expect(config.discord.token).toBeUndefined();
  });

  it('treats empty values as unset, so defaults apply', () => {
    const config = loadConfig({ DRY_RUN: '', SILENCE_THRESHOLD_SECONDS: '  ', DISCORD_TOKEN: '' });
    expect(config.behavior.dryRun).toBe(true);
    expect(config.behavior.silenceThresholdSeconds).toBe(300);
    expect(config.discord.token).toBeUndefined();
  });

  it('accepts .env.example as-is and keeps dry run on', () => {
    const example = parseEnvFile(readFileSync(new URL('../../.env.example', import.meta.url), 'utf8'));
    const config = loadConfig(example);
    expect(config.behavior.dryRun).toBe(true);
  });

  it('disables dry run only for an explicit "false"', () => {
    expect(loadConfig({ DRY_RUN: 'false' }).behavior.dryRun).toBe(false);
    expect(loadConfig({ DRY_RUN: ' FALSE ' }).behavior.dryRun).toBe(false);
    expect(loadConfig({ DRY_RUN: 'true' }).behavior.dryRun).toBe(true);
  });

  it('rejects ambiguous booleans instead of guessing', () => {
    for (const value of ['0', 'no', 'off', 'yes', '1', 'flase']) {
      expect(() => loadConfig({ DRY_RUN: value })).toThrow(ConfigError);
    }
  });

  it('property: real disconnects are enabled only by an explicit "false"', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const explicitFalse = value.trim().toLowerCase() === 'false';
        let dryRun: boolean | 'error';
        try {
          dryRun = loadConfig({ DRY_RUN: value }).behavior.dryRun;
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigError);
          dryRun = 'error';
        }
        expect(dryRun === false).toBe(explicitFalse);
      }),
      { numRuns: 1000 },
    );
  });

  it('parses comma-separated ID lists', () => {
    const config = loadConfig({ EXEMPT_ROLE_IDS: ` ${ID_A}, ${ID_B} ,`, IGNORED_CHANNEL_IDS: ID_A });
    expect(config.behavior.exemptRoleIds).toEqual([ID_A, ID_B]);
    expect(config.behavior.ignoredChannelIds).toEqual([ID_A]);
  });

  it('rejects malformed IDs', () => {
    expect(() => loadConfig({ EXEMPT_ROLE_IDS: 'moderators' })).toThrow(/EXEMPT_ROLE_IDS/);
    expect(() => loadConfig({ DISCORD_CLIENT_ID: '42' })).toThrow(/DISCORD_CLIENT_ID/);
  });

  it('rejects out-of-range and non-integer numbers', () => {
    expect(() => loadConfig({ SILENCE_THRESHOLD_SECONDS: '0' })).toThrow(/SILENCE_THRESHOLD_SECONDS/);
    expect(() => loadConfig({ SILENCE_THRESHOLD_SECONDS: '5.5' })).toThrow(/SILENCE_THRESHOLD_SECONDS/);
    expect(() => loadConfig({ MIN_HUMANS: 'two' })).toThrow(/MIN_HUMANS/);
    expect(() => loadConfig({ METRICS_PORT: '70000' })).toThrow(/METRICS_PORT/);
  });

  it('rejects non-redis URLs and unknown enum values', () => {
    expect(() => loadConfig({ REDIS_URL: 'http://localhost:6379' })).toThrow(/REDIS_URL/);
    expect(() => loadConfig({ DECISION_POLICY: 'llm' })).toThrow(/DECISION_POLICY/);
    expect(() => loadConfig({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('reports every problem at once', () => {
    try {
      loadConfig({ MIN_HUMANS: 'x', DRY_RUN: 'maybe' });
      expect.unreachable('loadConfig should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const paths = (err as ConfigError).issues.map((i) => i.split(':')[0]);
      expect(paths).toEqual(expect.arrayContaining(['MIN_HUMANS', 'DRY_RUN']));
    }
  });

  it('never echoes values in error messages, so secrets cannot leak into logs', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 8 }).filter((s) => /[a-z]{8}/i.test(s)), (secret) => {
        try {
          loadConfig({ DISCORD_CLIENT_ID: secret, REDIS_URL: secret, DRY_RUN: secret });
        } catch (err) {
          expect((err as Error).message).not.toContain(secret.trim());
        }
      }),
      { numRuns: 200 },
    );
  });
});

/** Minimal .env parser for the test: KEY=value, strips full-line and inline `#` comments. */
function parseEnvFile(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).replace(/\s+#.*$/, '').trim();
    env[key] = value;
  }
  return env;
}
