import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores([
        '**/dist/',
        '**/node_modules/',
        'src/map/proto/**/*',
        'src/sink/proto/**/*',
        'src/source/proto/**/*',
        'src/sourcetransformer/proto/**/*',
        'examples/',
        'eslint.config.mjs',
    ]),
    {
        extends: compat.extends(
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:prettier/recommended',
        ),

        plugins: {
            '@typescript-eslint': typescriptEslint,
            prettier,
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },

            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',

            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            'prettier/prettier': 'error',

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                },
            ],

            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-empty-function': 'off',
            'no-console': 'warn',
            '@typescript-eslint/strict-boolean-expressions': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
        },
    },
]);
