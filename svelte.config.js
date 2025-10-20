import adapterAuto from '@sveltejs/adapter-auto';
import vercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Use Vercel adapter only in deploy environments to avoid local Node version constraints.
		adapter: process.env.VERCEL ? vercel({ runtime: 'nodejs20.x' }) : adapterAuto()
	}
};

export default config;
