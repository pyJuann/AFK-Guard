// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// CLAUDE.md architecture rule 1: /src/core is pure. No I/O libraries, no Node built-ins,
// no ambient time. Time arrives through an injected Clock.
const CORE_FORBIDDEN_MODULES = [
  'discord.js',
  '@discordjs/*',
  'ioredis',
  'pino',
  'pino-*',
  'prom-client',
  'node:*',
  'fs',
  'fs/*',
  'timers',
  'timers/*',
  'perf_hooks',
  'process',
  'child_process',
  'net',
  'http',
  'https',
];

const CORE_FORBIDDEN_GLOBALS = [
  'Date',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'clearTimeout',
  'clearInterval',
  'clearImmediate',
  'queueMicrotask',
  'performance',
  'process',
  'console',
].map((name) => ({
  name,
  message: `Core must be pure (CLAUDE.md rule 1). Inject a Clock or return an effect instead of using ${name}.`,
}));

export default tseslint.config(
  {
    ignores: ['dist/', 'coverage/', 'reports/', '.stryker-tmp/', 'node_modules/', 'ml/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // A non-null assertion needs an eslint-disable comment explaining why it is safe (CLAUDE.md).
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: CORE_FORBIDDEN_MODULES,
              message: 'Core must be pure (CLAUDE.md rule 1). Move I/O to /src/adapters.',
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', ...CORE_FORBIDDEN_GLOBALS],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='globalThis']",
          message: 'Core must be pure (CLAUDE.md rule 1). Do not reach into globalThis.',
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);
