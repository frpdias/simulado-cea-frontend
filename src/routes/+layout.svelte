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
		
		/* Enhanced responsive variables */
		--container-max-width: 1200px;
		--container-padding: clamp(1rem, 3vw, 2rem);
		--spacing-xs: clamp(0.25rem, 0.5vw, 0.5rem);
		--spacing-sm: clamp(0.5rem, 1vw, 0.75rem);
		--spacing-md: clamp(0.75rem, 1.5vw, 1rem);
		--spacing-lg: clamp(1rem, 2vw, 1.5rem);
		--spacing-xl: clamp(1.5rem, 3vw, 2rem);
		--spacing-2xl: clamp(2rem, 4vw, 3rem);
		
		/* Fluid typography */
		--text-xs: clamp(0.75rem, 1.5vw, 0.85rem);
		--text-sm: clamp(0.85rem, 1.7vw, 0.95rem);
		--text-base: clamp(0.95rem, 1.9vw, 1.1rem);
		--text-lg: clamp(1.1rem, 2.2vw, 1.25rem);
		--text-xl: clamp(1.25rem, 2.5vw, 1.5rem);
		--text-2xl: clamp(1.5rem, 3vw, 2rem);
		--text-3xl: clamp(2rem, 4vw, 2.5rem);
		--text-4xl: clamp(2.5rem, 5vw, 3.5rem);
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(html) {
		scroll-behavior: smooth;
		-webkit-text-size-adjust: 100%;
		-moz-text-size-adjust: 100%;
		text-size-adjust: 100%;
	}

	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background: var(--surface-main);
		color: var(--text-primary);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		line-height: 1.6;
		font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
		overflow-x: hidden;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	:global(button) {
		font-family: inherit;
		cursor: pointer;
		border: none;
		background: none;
		transition: all 0.2s ease;
	}

	:global(input, textarea, select) {
		font-family: inherit;
		font-size: inherit;
	}

	/* Responsive container utility */
	:global(.container) {
		width: 100%;
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: 0 var(--container-padding);
	}

	/* Responsive grid utilities */
	:global(.grid) {
		display: grid;
		gap: var(--spacing-lg);
	}

	:global(.grid-cols-1) {
		grid-template-columns: 1fr;
	}

	:global(.grid-cols-2) {
		grid-template-columns: repeat(2, 1fr);
	}

	:global(.grid-cols-3) {
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 768px) {
		:global(.grid-cols-2),
		:global(.grid-cols-3) {
			grid-template-columns: 1fr;
		}
	}

	/* Responsive flexbox utilities */
	:global(.flex) {
		display: flex;
		gap: var(--spacing-md);
	}

	:global(.flex-col) {
		flex-direction: column;
	}

	:global(.flex-wrap) {
		flex-wrap: wrap;
	}

	:global(.justify-center) {
		justify-content: center;
	}

	:global(.justify-between) {
		justify-content: space-between;
	}

	:global(.items-center) {
		align-items: center;
	}

	/* Responsive spacing utilities */
	:global(.p-xs) { padding: var(--spacing-xs); }
	:global(.p-sm) { padding: var(--spacing-sm); }
	:global(.p-md) { padding: var(--spacing-md); }
	:global(.p-lg) { padding: var(--spacing-lg); }
	:global(.p-xl) { padding: var(--spacing-xl); }
	:global(.p-2xl) { padding: var(--spacing-2xl); }

	:global(.px-xs) { padding-left: var(--spacing-xs); padding-right: var(--spacing-xs); }
	:global(.px-sm) { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
	:global(.px-md) { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
	:global(.px-lg) { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }

	:global(.py-xs) { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
	:global(.py-sm) { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
	:global(.py-md) { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
	:global(.py-lg) { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }

	:global(.m-xs) { margin: var(--spacing-xs); }
	:global(.m-sm) { margin: var(--spacing-sm); }
	:global(.m-md) { margin: var(--spacing-md); }
	:global(.m-lg) { margin: var(--spacing-lg); }
	:global(.m-xl) { margin: var(--spacing-xl); }

	:global(.mt-xs) { margin-top: var(--spacing-xs); }
	:global(.mt-sm) { margin-top: var(--spacing-sm); }
	:global(.mt-md) { margin-top: var(--spacing-md); }
	:global(.mt-lg) { margin-top: var(--spacing-lg); }
	:global(.mt-xl) { margin-top: var(--spacing-xl); }

	:global(.mb-xs) { margin-bottom: var(--spacing-xs); }
	:global(.mb-sm) { margin-bottom: var(--spacing-sm); }
	:global(.mb-md) { margin-bottom: var(--spacing-md); }
	:global(.mb-lg) { margin-bottom: var(--spacing-lg); }
	:global(.mb-xl) { margin-bottom: var(--spacing-xl); }

	/* Responsive text utilities */
	:global(.text-xs) { font-size: var(--text-xs); }
	:global(.text-sm) { font-size: var(--text-sm); }
	:global(.text-base) { font-size: var(--text-base); }
	:global(.text-lg) { font-size: var(--text-lg); }
	:global(.text-xl) { font-size: var(--text-xl); }
	:global(.text-2xl) { font-size: var(--text-2xl); }
	:global(.text-3xl) { font-size: var(--text-3xl); }
	:global(.text-4xl) { font-size: var(--text-4xl); }

	:global(.text-center) { text-align: center; }
	:global(.text-left) { text-align: left; }
	:global(.text-right) { text-align: right; }

	/* Responsive display utilities */
	:global(.hidden) { display: none; }
	:global(.block) { display: block; }
	:global(.inline-block) { display: inline-block; }

	@media (max-width: 640px) {
		:global(.sm\\:hidden) { display: none; }
		:global(.sm\\:block) { display: block; }
		:global(.sm\\:flex) { display: flex; }
	}

	@media (max-width: 768px) {
		:global(.md\\:hidden) { display: none; }
		:global(.md\\:block) { display: block; }
		:global(.md\\:flex) { display: flex; }
	}

	@media (max-width: 1024px) {
		:global(.lg\\:hidden) { display: none; }
		:global(.lg\\:block) { display: block; }
		:global(.lg\\:flex) { display: flex; }
	}

	/* Focus and accessibility improvements */
	:global(:focus-visible) {
		outline: 2px solid var(--brand-highlight);
		outline-offset: 2px;
		border-radius: 4px;
	}

	:global(button:focus-visible),
	:global(input:focus-visible),
	:global(textarea:focus-visible),
	:global(select:focus-visible) {
		outline: 2px solid var(--brand-highlight);
		outline-offset: 2px;
	}

	/* Smooth scrolling and performance */
	:global(.will-change-transform) {
		will-change: transform;
	}

	:global(.will-change-opacity) {
		will-change: opacity;
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		:global(*) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
			scroll-behavior: auto !important;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		:global(:root) {
			--border-soft: rgba(255, 255, 255, 0.8);
			--text-muted: rgba(255, 255, 255, 0.9);
		}
	}

	/* Print styles */
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}
		
		:global(.no-print) {
			display: none !important;
		}
	}
</style>
