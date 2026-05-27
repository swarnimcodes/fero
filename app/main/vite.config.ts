import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
	],
	clearScreen: false,
	envPrefix: ['VITE_', 'TAURI_'],
	server: {
		port: 1420,
		strictPort: true,
		fs: {
			allow: [path.resolve(__dirname)],
		},
	},
	build: {
		outDir: './dist',
		// https://tauri.app/v1/references/webview-versions
		target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari15',
		minify: !process.env.TAURI_DEBUG,
		sourcemap: !!process.env.TAURI_DEBUG,
		emptyOutDir: true,
	},
	// https://vitest.dev/config/
	test: {
		include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
	},
})
