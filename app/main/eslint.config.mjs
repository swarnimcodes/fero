import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'

export default [
	{
		// Global ignores — folders must be ignored at the top level
		ignores: [
			'**/dist/',
			'**/vendor/',
			'**/node_modules/',
			'**/target/',
		],
	},
	{ files: ['**/*.{js,mjs,cjs,ts,tsx}'] },
	{ files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	// react-hooks v7: configs.recommended is a full flat-config object
	pluginReactHooks.configs.recommended,
	{
		plugins: {
			react: pluginReact,
		},
		settings: {
			react: { version: 'detect' },
		},
		rules: {
			...pluginReact.configs.recommended.rules,
			// React 17+ JSX transform — no need to import React
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			// General
			// eslint-disable-next-line no-undef
			'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
			// eslint-disable-next-line no-undef
			'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
			'new-cap': 'off',
			'camelcase': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
]
