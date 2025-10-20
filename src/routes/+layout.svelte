<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
	/>
</svelte:head>

{@render children?.()}

<style>
	:global(:root) {
		--brand-primary: #1d4ed8;
		--brand-secondary: #6366f1;
		--brand-highlight: #f97316;
		--surface-main: linear-gradient(180deg, #0f172a 0%, #111827 100%);
		--surface-card: rgba(15, 23, 42, 0.75);
		--surface-glass: rgba(30, 41, 59, 0.65);
		--border-soft: rgba(148, 163, 184, 0.25);
		--text-primary: #f8fafc;
		--text-secondary: #cbd5f5;
		--text-muted: #94a3b8;
		--shadow-lg: 0 32px 60px rgba(15, 23, 42, 0.45);
		--shadow-md: 0 20px 40px rgba(15, 23, 42, 0.35);
		--radius-lg: 26px;
		--radius-md: 18px;
		--radius-sm: 12px;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
		background: var(--surface-main);
		color: var(--text-primary);
		-webkit-font-smoothing: antialiased;
	}

	:global(a) {
		color: inherit;
	}

	:global(button) {
		font-family: inherit;
	}
</style>
