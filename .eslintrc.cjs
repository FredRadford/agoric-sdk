/* eslint-disable no-restricted-syntax */
/* eslint-env node */

const deprecatedForLoanContract = [
  ['currency', 'brand, asset or another descriptor'],
  ['blacklist', 'denylist'],
  ['whitelist', 'allowlist'],
  ['RUN', 'IST', '/RUN/'],
];
const allDeprecated = [...deprecatedForLoanContract, ['loan', 'debt']];

const deprecatedTerminology = Object.fromEntries(
  Object.entries({
    all: allDeprecated,
    loanContract: deprecatedForLoanContract,
  }).map(([category, deprecated]) => [
    category,
    deprecated.flatMap(([bad, good, badRgx = `/${bad}/i`]) =>
      [
        ['Literal', 'value'],
        ['TemplateElement', 'value.raw'],
        ['Identifier', 'name'],
      ].map(([selectorType, field]) => ({
        selector: `${selectorType}[${field}=${badRgx}]`,
        message: `Use '${good}' instead of deprecated '${bad}'`,
      })),
    ),
  ]),
);

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Works for us!
    EXPERIMENTAL_useProjectService: true,
    sourceType: 'module',
    project: [
      './packages/*/tsconfig.json',
      './packages/*/tsconfig.json',
      './packages/wallet/*/tsconfig.json',
      './tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.cjs'],
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['@agoric', 'plugin:ava/recommended'],
  rules: {
    '@typescript-eslint/prefer-ts-expect-error': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    // so that floating-promises can be explicitly permitted with void operator
    'no-void': ['error', { allowAsStatement: true }],

    // We allow disabled tests in master
    'ava/no-skip-test': 'off',
    // Contrary to recommendation https://github.com/avajs/ava/blob/main/docs/recipes/typescript.md#typing-tcontext
    'ava/use-test': 'off',

    // The rule is “safe await separator" which implements the architectural
    // goal of “clearly separate an async function's synchronous prelude from
    // the part that runs in a future turn”. That is our architectural rule. It
    // can be trivially satisfied by inserting a non-nested `await null` in an
    // appropriate place to ensure the rest of the async function runs in a
    // future turn.  “sometimes synchronous" is a bug farm for particularly
    // pernicious bugs in which you can combine two correct pieces of code to
    // have emergent incorrect behavior.  It’s absolutely critical for shared
    // service code. That means contracts, but it also means kernel components
    // that are used by multiple clients. So we enable it throughout the repo
    // and aim for no exceptions.
    //
    // The default is 'warn', but we want to enforce 'error'.
    '@jessie.js/safe-await-separator': 'error',

    // CI has a separate format check but keep this warn to maintain that "eslint --fix" prettifies
    // UNTIL https://github.com/Agoric/agoric-sdk/issues/4339
    'prettier/prettier': 'warn',
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
    },
  },
  ignorePatterns: [
    'coverage/**',
    '**/output/**',
    'bundles/**',
    'bundle-*',
    'dist/**',
    'examples/**',
    'test262/**',
    '*.html',
    'ava*.config.js',
  ],
  overrides: [
    {
      // Tighten rules for exported code.
      files: [
        'packages/*/src/**/*.js',
        'packages/*/tools/**/*.js',
        'packages/*/*.js',
        'packages/wallet/api/src/**/*.js',
      ],
      rules: {
        'no-restricted-syntax': ['error', ...deprecatedTerminology.all],
      },
    },
    {
      files: [
        'packages/**/demo/**/*.js',
        'packages/*/test/**/*.js',
        'packages/*/test/**/*.test.js',
        'packages/wallet/api/test/**/*.js',
      ],
      rules: {
        // sometimes used for organizing logic
        'no-lone-blocks': 'off',

        // NOTE: This rule is enabled for the repository in general.  We turn it
        // off for test code for now.
        '@jessie.js/safe-await-separator': 'off',
      },
    },
    {
      // These tests use EV() instead of E(), which are easy to confuse.
      // Help by erroring when E() packages are imported.
      files: ['packages/boot/test/**/test-*'],
      rules: {
        'no-restricted-imports': [
          'error',
          { paths: ['@endo/eventual-send', '@endo/far'] },
        ],
      },
    },
    {
      // Allow "loan" contracts to mention the word "loan".
      files: ['packages/zoe/src/contracts/loan/*.js'],
      rules: {
        'no-restricted-syntax': [
          'error',
          ...deprecatedTerminology.loanContract,
        ],
      },
    },
    {
      files: ['*.ts'],
      rules: {
        // TS has this covered and eslint gets it wrong
        'no-undef': 'off',
      },
    },
    {
      // disable type-aware linting in HTML
      files: ['*.html'],
      parserOptions: {
        project: false,
      },
    },
    {
      files: ['packages/**/upgrade-test-scripts/**/*.*js'],
      rules: {
        // NOTE: This rule is enabled for the repository in general.  We turn it
        // off for test code for now.
        '@jessie.js/safe-await-separator': 'off',
      },
    },
  ],
};
