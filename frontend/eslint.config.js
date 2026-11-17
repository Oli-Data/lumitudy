import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['.next', 'dist', 'dist-observatory', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: { ...globals.browser, process: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  { files: ['*.{js,mjs}', 'scripts/*.mjs'], languageOptions: { globals: globals.node } },
])
