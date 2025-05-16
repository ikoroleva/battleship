import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import js                 from '@eslint/js';
import tsPlugin           from '@typescript-eslint/eslint-plugin';
import tsParser           from '@typescript-eslint/parser';
import prettierPlugin     from 'eslint-plugin-prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,

  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: resolve(__dirname, 'tsconfig.json'),
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    ignores: ['eslint.config.js'],
  },
];
