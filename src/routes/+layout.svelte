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
		
		/* Glass morphism variables */
		--glass-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
		--glass-border: rgba(255, 255, 255, 0.2);
		--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		--glass-backdrop: blur(20px);
		
		/* Animation variables */
		--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		--transition-bounce: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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

	/* Glass morphism card utility */
	:global(.glass-card) {
		background: var(--glass-bg);
		backdrop-filter: var(--glass-backdrop);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--glass-shadow);
		position: relative;
		overflow: hidden;
	}

	:global(.glass-card::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		pointer-events: none;
	}

	/* Button utilities */
	:global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md) var(--spacing-xl);
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: var(--text-sm);
		transition: var(--transition-smooth);
		cursor: pointer;
		border: none;
		text-decoration: none;
		position: relative;
		overflow: hidden;
	}

	:global(.btn-primary) {
		background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
		color: white;
		box-shadow: 0 4px 12px rgba(29, 78, 216, 0.3);
	}

	:global(.btn-primary:hover) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(29, 78, 216, 0.4);
	}

	:global(.btn-secondary) {
		background: var(--glass-bg);
		backdrop-filter: var(--glass-backdrop);
		border: 1px solid var(--glass-border);
		color: var(--text-primary);
	}

	:global(.btn-secondary:hover) {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-1px);
	}

	/* Floating background shapes */
	:global(.floating-bg) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: -1;
		overflow: hidden;
	}

	:global(.floating-shape) {
		position: absolute;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05));
		animation: float 20s ease-in-out infinite;
	}

	:global(.floating-shape:nth-child(1)) {
		width: 300px;
		height: 300px;
		top: 10%;
		left: 10%;
		animation-delay: 0s;
	}

	:global(.floating-shape:nth-child(2)) {
		width: 200px;
		height: 200px;
		top: 60%;
		right: 10%;
		animation-delay: -5s;
	}

	:global(.floating-shape:nth-child(3)) {
		width: 150px;
		height: 150px;
		bottom: 20%;
		left: 20%;
		animation-delay: -10s;
	}

	@keyframes :global(float) {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		25% { transform: translateY(-20px) rotate(5deg); }
		50% { transform: translateY(10px) rotate(-5deg); }
		75% { transform: translateY(-15px) rotate(3deg); }
	}

	/* Form utilities */
	:global(.form-group) {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	:global(.form-input) {
		padding: var(--spacing-md);
		border-radius: var(--radius-sm);
		border: 1px solid var(--glass-border);
		background: var(--glass-bg);
		backdrop-filter: var(--glass-backdrop);
		color: var(--text-primary);
		font-size: var(--text-base);
		transition: var(--transition-smooth);
	}

	:global(.form-input:focus) {
		outline: none;
		border-color: var(--brand-primary);
		box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
	}

	:global(.form-label) {
		font-weight: 600;
		color: var(--text-secondary);
		font-size: var(--text-sm);
	}

	/* Alert utilities */
	:global(.alert) {
		padding: var(--spacing-md);
		border-radius: var(--radius-sm);
		margin-bottom: var(--spacing-lg);
		font-size: var(--text-sm);
	}

	:global(.alert-success) {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #4ade80;
	}

	:global(.alert-error) {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #f87171;
	}

	/* Loading utilities */
	:global(.loading) {
		opacity: 0.7;
		pointer-events: none;
		cursor: not-allowed;
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
