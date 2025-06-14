import { FlatCompat } from '@eslint/eslintrc';
import { configs } from '@eslint/js';

// Mimic ESLintRC functionality in flat config
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  configs.recommended,
  ...compat.config({
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    root: true,
    env: {
      node: true,
      jest: true,
    },
  }),
  {
    ignores: ['.eslintrc.js'],
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
