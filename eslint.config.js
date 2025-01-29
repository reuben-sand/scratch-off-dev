import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfig } from 'eslint/config'

export default defineConfig([
	js.configs.recommended,
	{
		name: 'app/files-my-rules',
		rules: {
			'no-unused-vars': 'warn',
			'no-template-curly-in-string': 'warn',
			'no-console': 'warn',
		},
	},
	{
		name: 'app/files-to-lint',
		files: ['**/*.{js,mjs,jsx,vue}'],
	},
	{
		name: 'app/files-to-ignore',
		ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
	},

	...pluginVue.configs['flat/essential'],

	{
		...pluginVitest.configs.recommended,
		files: ['src/**/__tests__/*'],
	},
	skipFormatting,
])
