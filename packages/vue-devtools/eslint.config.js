// @ts-check

import pluginVue from 'eslint-plugin-vue'
import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },
]
