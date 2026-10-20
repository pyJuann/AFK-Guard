import { z } from 'zod';

/**
 * Runtime configuration, parsed from environment variables.
 * Every variable here must also appear in .env.example.
 */

// Treat `VAR=` (empty) the same as unset, so defaults apply.
const emptyAsUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(emptyAsUndefined, z.string().trim().min(1).optional());

const boolFlag = (fallback: boolean) =>
  z.preprocess(
    emptyAsUndefined,
    z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.enum(['true', 'false'], { error: 'must be "true" or "false"' }))
      .transform((v) => v === 'true')
      .default(fallback),
  );

const intInRange = (fallback: number, min: number, max: number) =>
  z.preprocess(emptyAsUndefined, z.coerce.number().int().min(min).max(max).default(fallback));

// Discord IDs are snowflakes: unsigned 64-bit integers written as decimal strings.
const snowflake = z.string().regex(/^\d{17,20}$/, 'must be a Discord ID (17-20 digits)');

const idList = z.preprocess(
  emptyAsUndefined,
  z
    .string()
    .default('')
    .transform((raw) =>
      raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    )
    .pipe(z.array(snowflake)),
);

const envSchema = z.object({
  DISCORD_TOKEN: optionalString,
  DISCORD_CLIENT_ID: z.preprocess(emptyAsUndefined, snowflake.optional()),

  SILENCE_THRESHOLD_SECONDS: intInRange(300, 30, 86_400),
  MIN_HUMANS: intInRange(2, 1, 99),
  SWITCH_MARGIN: intInRange(2, 1, 99),
  ELECTION_STABLE_SECONDS: intInRange(20, 0, 3_600),
  MIN_DWELL_SECONDS: intInRange(60, 0, 3_600),
  GRACE_SECONDS: intInRange(0, 0, 600),
  NOTICE_COALESCE_MS: intInRange(2_000, 0, 60_000),
  EXEMPT_STREAMING: boolFlag(true),
  EXEMPT_CAMERA: boolFlag(true),
  EXEMPT_ROLE_IDS: idList,
  IGNORED_CHANNEL_IDS: idList,
  // CLAUDE.md rule 6: dry run is the default. Only the literal "false" enables real disconnects.
  DRY_RUN: boolFlag(true),

  REDIS_URL: z.preprocess(
    emptyAsUndefined,
    z
      .url({ protocol: /^rediss?$/, error: 'must be a redis:// or rediss:// URL' })
      .default('redis://localhost:6379'),
  ),
  STATE_TTL_SECONDS: intInRange(86_400, 60, 30 * 86_400),
  METRICS_PORT: intInRange(9_464, 1, 65_535),
  LOG_LEVEL: z.preprocess(
    emptyAsUndefined,
    z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  ),

  DECISION_POLICY: z.preprocess(emptyAsUndefined, z.enum(['rules', 'shadow', 'model']).default('rules')),
  ANTHROPIC_API_KEY: optionalString,
  LLM_MODEL: optionalString,
  LANGFUSE_PUBLIC_KEY: optionalString,
  LANGFUSE_SECRET_KEY: optionalString,
});

export interface Config {
  readonly discord: {
    readonly token: string | undefined;
    readonly clientId: string | undefined;
  };
  readonly behavior: {
    readonly silenceThresholdSeconds: number;
    readonly minHumans: number;
    readonly switchMargin: number;
    readonly electionStableSeconds: number;
    readonly minDwellSeconds: number;
    readonly graceSeconds: number;
    readonly noticeCoalesceMs: number;
    readonly exemptStreaming: boolean;
    readonly exemptCamera: boolean;
    readonly exemptRoleIds: readonly string[];
    readonly ignoredChannelIds: readonly string[];
    readonly dryRun: boolean;
  };
  readonly infra: {
    readonly redisUrl: string;
    readonly stateTtlSeconds: number;
    readonly metricsPort: number;
    readonly logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  };
  readonly ai: {
    readonly decisionPolicy: 'rules' | 'shadow' | 'model';
    readonly anthropicApiKey: string | undefined;
    readonly llmModel: string | undefined;
    readonly langfusePublicKey: string | undefined;
    readonly langfuseSecretKey: string | undefined;
  };
}

export class ConfigError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid configuration:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

/**
 * Parse configuration from an environment-like record.
 * Error messages name the variable and the rule, never the value, so secrets do not leak into logs.
 */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
  }
  const e = result.data;
  return {
    discord: { token: e.DISCORD_TOKEN, clientId: e.DISCORD_CLIENT_ID },
    behavior: {
      silenceThresholdSeconds: e.SILENCE_THRESHOLD_SECONDS,
      minHumans: e.MIN_HUMANS,
      switchMargin: e.SWITCH_MARGIN,
      electionStableSeconds: e.ELECTION_STABLE_SECONDS,
      minDwellSeconds: e.MIN_DWELL_SECONDS,
      graceSeconds: e.GRACE_SECONDS,
      noticeCoalesceMs: e.NOTICE_COALESCE_MS,
      exemptStreaming: e.EXEMPT_STREAMING,
      exemptCamera: e.EXEMPT_CAMERA,
      exemptRoleIds: e.EXEMPT_ROLE_IDS,
      ignoredChannelIds: e.IGNORED_CHANNEL_IDS,
      dryRun: e.DRY_RUN,
    },
    infra: {
      redisUrl: e.REDIS_URL,
      stateTtlSeconds: e.STATE_TTL_SECONDS,
      metricsPort: e.METRICS_PORT,
      logLevel: e.LOG_LEVEL,
    },
    ai: {
      decisionPolicy: e.DECISION_POLICY,
      anthropicApiKey: e.ANTHROPIC_API_KEY,
      llmModel: e.LLM_MODEL,
      langfusePublicKey: e.LANGFUSE_PUBLIC_KEY,
      langfuseSecretKey: e.LANGFUSE_SECRET_KEY,
    },
  };
}
