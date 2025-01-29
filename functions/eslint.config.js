import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig([
	globalIgnores(['node_modules/**', 'dist/**']),
	js.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	{
		name: 'app/files-my-rules',
		rules: {
			'no-unused-vars': 'warn',
		},
	},
])
