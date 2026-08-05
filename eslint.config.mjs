import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import globals from 'globals';

// Design-system enforcement. Without these the token layer decays back into
// raw utilities the way the previous one did — it reached about 3% adoption
// because nothing stopped a new `bg-gray-100` from being written.
const RAW_PALETTE =
  'gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const designSystemRules = {
  'no-restricted-syntax': [
    'error',
    {
      selector: `Literal[value=/(?:^|\\\\s)(?:[a-z0-9-]+:)*(?:bg|text|border|ring|divide|placeholder|from|via|to)-(?:${RAW_PALETTE})-\\\\d{2,3}/]`,
      message:
        "Raw Tailwind palette colour. Use a design token instead (bg-surface, text-ink-muted, border-line...). Tokens carry a dark-mode value; raw palette classes do not. See packages/tokens/src/tokens.js.",
    },
    {
      selector: 'Literal[value=/#[0-9a-fA-F]{6}\\\\b/]',
      message:
        'Hardcoded hex colour. Add it to packages/tokens/src/tokens.js and use the generated token so it themes correctly and stays in sync with the mobile app.',
    },
    {
      selector: 'Literal[value=/(?:^|\\\\s)rounded(?:-[tblr]{1,2})?-(?:sm|md|lg|xl|2xl|3xl|full)(?:\\\\s|$)/]',
      message:
        'Use a role-named radius (rounded-chip / control / card / panel / pill) rather than a size name, so "which rounding does a card get" has one answer.',
    },
    {
      selector: 'Literal[value=/(?:^|\\\\s)dark:(?:[a-z0-9-]+:)*(?:bg|text|border|ring|divide|from|via|to)-/]',
      message:
        'No dark: colour variants. The tokens already resolve per theme, and a dark: override outranks the variable it is trying to help.',
    },
  ],
};

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'laravel-backend/**',
      'marketplace_app/**',
      'public/sw.js',
      // Generated output; the authored source is packages/tokens/src/tokens.js.
      'packages/tokens/dist/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'jsx-a11y': jsxA11y, react },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Marks components referenced in JSX as used. Without it every imported
      // component reads as dead, which buries the real unused-import warnings.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // Accessibility is enforced as errors — warnings get ignored in practice.
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either' }],
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      // React handles these; the base rules produce noise in JSX files.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(React|_)' }],
      'no-undef': 'off',
      ...designSystemRules,
    },
  },
  {
    // The token source is where literals are supposed to live, and the build
    // scripts are Node programs rather than browser modules.
    files: ['packages/tokens/**'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-restricted-syntax': 'off', 'no-undef': 'off' },
  },
];
