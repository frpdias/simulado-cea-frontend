<script lang="ts">
	const logoUrl = '/FULLSTACK3.png';
</script>

<main class="landing">
	<section class="landing__hero">
		<div class="landing__brand">
			<div class="brand-logo">
				<img src={logoUrl} alt="FullStack Educacional" loading="lazy" />
				<div class="brand-pulse"></div>
			</div>
			<div class="brand-text">
				<strong>Simulado CEA</strong>
				<span class="brand-subtitle">ANBIMA Certificação</span>
			</div>
		</div>

		<div class="hero-content">
			<h1>
				<span class="highlight">Treine</span> com segurança,
				<span class="highlight">avance</span> com confiança.
			</h1>
			<p>
				Simulados realistas, monitoramento inteligente e um painel completo para você dominar a
				prova do Certificado de Especialista ANBIMA.
			</p>

			<div class="stats-preview">
				<div class="stat-item">
					<span class="stat-number">500+</span>
					<span class="stat-label">Questões</span>
				</div>
				<div class="stat-item">
					<span class="stat-number">95%</span>
					<span class="stat-label">Aprovação</span>
				</div>
				<div class="stat-item">
					<span class="stat-number">24/7</span>
					<span class="stat-label">Disponível</span>
				</div>
			</div>
		</div>

		<nav class="landing__actions">
			<a class="action primary" href="/cadastro">
				<span>Começar agora</span>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M5 12h14M12 5l7 7-7 7"/>
				</svg>
			</a>
			<a class="action secondary" href="/painel">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H9"/>
				</svg>
				<span>Entrar como aluno</span>
			</a>
		</nav>

		<div class="landing__meta">
			<div class="meta-item">
				<div class="meta-icon">📚</div>
				<span>Questões atualizadas por especialistas</span>
			</div>
			<div class="meta-item">
				<div class="meta-icon">⚡</div>
				<span>Sala do administrador integrada</span>
			</div>
			<div class="meta-item">
				<div class="meta-icon">📱</div>
				<span>Estude onde estiver</span>
			</div>
		</div>
	</section>

	<section class="landing__menu">
		<div class="menu-header">
			<h2>Navegue rapidamente</h2>
			<p class="menu-subtitle">Acesse todas as funcionalidades da plataforma</p>
		</div>

		<div class="landing__grid">
			<a href="/painel" class="menu-card featured">
				<div class="card-icon">📊</div>
				<div class="card-content">
					<span class="menu-card__title">Painel do Aluno</span>
					<small>Resumo do desempenho, simulados e filtros por tema</small>
					<div class="card-badge">Popular</div>
				</div>
				<div class="card-arrow">→</div>
			</a>
			<a href="/login" class="menu-card">
				<div class="card-icon">🔐</div>
				<div class="card-content">
					<span class="menu-card__title">Login</span>
					<small>Acesse sua conta e continue de onde parou</small>
				</div>
				<div class="card-arrow">→</div>
			</a>
			<a href="/cadastro" class="menu-card">
				<div class="card-icon">✨</div>
				<div class="card-content">
					<span class="menu-card__title">Cadastro</span>
					<small>Crie uma conta e comece a treinar em minutos</small>
				</div>
				<div class="card-arrow">→</div>
			</a>
			<a href="/pagamento" class="menu-card">
				<div class="card-icon">💳</div>
				<div class="card-content">
					<span class="menu-card__title">Pagamento</span>
					<small>Planos e condições especiais para sua aprovação</small>
				</div>
				<div class="card-arrow">→</div>
			</a>
			<a href="/admin-login" class="menu-card admin">
				<div class="card-icon">⚙️</div>
				<div class="card-content">
					<span class="menu-card__title">Painel Admin</span>
					<small>Gestão de usuários e acompanhamento em tempo real</small>
					<div class="card-badge admin">Admin</div>
				</div>
				<div class="card-arrow">→</div>
			</a>
		</div>
	</section>
</main>

<style>
	:global(body) {
		overflow-x: hidden;
	}

	.landing {
		min-height: calc(100vh - 4rem);
		padding: clamp(1.5rem, 3vw, 3rem) clamp(1rem, 4vw, 4.5rem);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr));
		gap: clamp(2rem, 5vw, 4rem);
		position: relative;
		background: 
			radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.1) 0%, transparent 50%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 1) 100%);
	}

	.landing::after,
	.landing::before {
		content: '';
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
		opacity: 0.4;
		z-index: 0;
		animation: float 8s ease-in-out infinite;
	}

	.landing::before {
		width: clamp(300px, 40vw, 520px);
		height: clamp(300px, 40vw, 520px);
		top: -160px;
		right: -120px;
		background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.6), transparent 65%);
		animation-delay: -4s;
	}

	.landing::after {
		width: clamp(250px, 35vw, 420px);
		height: clamp(250px, 35vw, 420px);
		bottom: -180px;
		left: -140px;
		background: radial-gradient(circle at 40% 40%, rgba(249, 115, 22, 0.5), transparent 70%);
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) scale(1); }
		50% { transform: translateY(-20px) scale(1.05); }
	}

	.landing__hero,
	.landing__menu {
		position: relative;
		z-index: 1;
		background: 
			linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
			rgba(15, 23, 42, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		box-shadow: 
			0 25px 50px rgba(0, 0, 0, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		border-radius: clamp(1rem, 2vw, 1.5rem);
		padding: clamp(1.5rem, 3vw, 2.8rem);
		display: flex;
		flex-direction: column;
		gap: clamp(1.25rem, 2.4vw, 2rem);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.landing__hero:hover,
	.landing__menu:hover {
		transform: translateY(-2px);
		box-shadow: 
			0 35px 60px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
	}

	.landing__brand {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		background: 
			linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
		padding: 1rem 1.25rem;
		border-radius: var(--radius-md);
		box-shadow: 
			inset 0 0 0 1px rgba(148, 163, 184, 0.3),
			0 10px 25px rgba(0, 0, 0, 0.1);
		max-width: fit-content;
		border: 1px solid rgba(99, 102, 241, 0.2);
	}

	.brand-logo {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.brand-logo img {
		width: clamp(40px, 5vw, 56px);
		height: clamp(40px, 5vw, 56px);
		object-fit: contain;
		filter: drop-shadow(0 12px 28px rgba(59, 130, 246, 0.4));
		position: relative;
		z-index: 2;
		transition: transform 0.3s ease;
	}

	.brand-logo:hover img {
		transform: scale(1.05) rotate(2deg);
	}

	.brand-pulse {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		background: rgba(99, 102, 241, 0.3);
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
		50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
		100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.brand-text strong {
		font-weight: 700;
		font-size: clamp(0.95rem, 1.2vw, 1.1rem);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--text-primary);
		background: linear-gradient(135deg, #fff 0%, rgba(148, 163, 184, 0.9) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.brand-subtitle {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 500;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2vw, 1.5rem);
	}

	h1 {
		font-size: clamp(1.8rem, 5vw, 3.2rem);
		line-height: 1.15;
		font-weight: 800;
		margin: 0;
		color: var(--text-primary);
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.highlight {
		background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		position: relative;
	}

	.highlight::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
		border-radius: 2px;
		opacity: 0.3;
	}

	p {
		margin: 0;
		color: var(--text-secondary);
		font-size: clamp(1rem, 1.3vw, 1.2rem);
		line-height: 1.7;
		max-width: 560px;
		font-weight: 400;
	}

	.stats-preview {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
		margin: 1rem 0;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: rgba(15, 23, 42, 0.6);
		border-radius: var(--radius-md);
		border: 1px solid rgba(99, 102, 241, 0.2);
		transition: transform 0.2s ease, border-color 0.2s ease;
	}

	.stat-item:hover {
		transform: translateY(-2px);
		border-color: rgba(99, 102, 241, 0.4);
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--brand-primary);
		text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.landing__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		border-radius: 999px;
		font-weight: 600;
		letter-spacing: 0.01em;
		text-decoration: none;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		min-width: 160px;
		font-size: clamp(0.9rem, 1vw, 1rem);
	}

	.action::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.action:hover::before {
		left: 100%;
	}

	.action.primary {
		background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
		color: #fff;
		box-shadow: 
			0 10px 25px rgba(99, 102, 241, 0.3),
			0 5px 10px rgba(0, 0, 0, 0.1);
	}

	.action.primary:hover {
		transform: translateY(-3px);
		box-shadow: 
			0 15px 35px rgba(99, 102, 241, 0.4),
			0 8px 15px rgba(0, 0, 0, 0.15);
	}

	.action.secondary {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-secondary);
		border: 1px solid rgba(99, 102, 241, 0.3);
		backdrop-filter: blur(10px);
	}

	.action.secondary:hover {
		transform: translateY(-3px);
		border-color: rgba(99, 102, 241, 0.5);
		background: rgba(99, 102, 241, 0.1);
		color: var(--text-primary);
		box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);
	}

	.landing__meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: var(--radius-md);
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.2);
		transition: all 0.2s ease;
	}

	.meta-item:hover {
		border-color: rgba(99, 102, 241, 0.3);
		transform: translateY(-1px);
	}

	.meta-icon {
		font-size: 1.5rem;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.meta-item span {
		color: var(--text-muted);
		font-size: clamp(0.85rem, 1vw, 0.95rem);
		line-height: 1.4;
		font-weight: 500;
	}

	.menu-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.menu-header h2 {
		margin: 0;
		font-size: clamp(1.3rem, 2vw, 1.6rem);
		font-weight: 700;
		color: var(--text-primary);
		background: linear-gradient(135deg, #fff 0%, rgba(148, 163, 184, 0.9) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.menu-subtitle {
		color: var(--text-muted);
		font-size: 0.95rem;
		margin: 0;
	}

	.landing__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.25rem;
	}

	.menu-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		background: 
			linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%);
		border: 1px solid rgba(148, 163, 184, 0.2);
		text-decoration: none;
		color: inherit;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.menu-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
		transform: scaleX(0);
		transition: transform 0.3s ease;
	}

	.menu-card:hover::before {
		transform: scaleX(1);
	}

	.menu-card:hover {
		transform: translateY(-4px);
		border-color: rgba(99, 102, 241, 0.4);
		box-shadow: 
			0 20px 40px rgba(99, 102, 241, 0.2),
			0 10px 20px rgba(0, 0, 0, 0.1);
		background: 
			linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
	}

	.menu-card.featured {
		border-color: rgba(99, 102, 241, 0.4);
		background: 
			linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%);
	}

	.menu-card.admin {
		border-color: rgba(249, 115, 22, 0.3);
		background: 
			linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);
	}

	.card-icon {
		font-size: 2rem;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
		transition: transform 0.3s ease;
	}

	.menu-card:hover .card-icon {
		transform: scale(1.1) rotate(5deg);
	}

	.card-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
	}

	.menu-card__title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: clamp(1rem, 1.1vw, 1.1rem);
		margin-bottom: 0.25rem;
	}

	.menu-card small {
		color: var(--text-muted);
		line-height: 1.5;
		font-size: 0.9rem;
	}

	.card-badge {
		position: absolute;
		top: -0.5rem;
		right: 0;
		background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	.card-badge.admin {
		background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
		box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
	}

	.card-arrow {
		font-size: 1.25rem;
		color: var(--text-muted);
		transition: all 0.3s ease;
		opacity: 0.6;
	}

	.menu-card:hover .card-arrow {
		transform: translateX(4px);
		color: var(--brand-primary);
		opacity: 1;
	}

	/* Responsive Design */
	@media (max-width: 900px) {
		.landing {
			padding: 2rem 1.5rem;
			gap: 2.5rem;
		}

		.landing__grid {
			grid-template-columns: 1fr;
		}

		.stats-preview {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 600px) {
		.landing {
			padding: 1.5rem 1rem;
		}

		.landing__hero,
		.landing__menu {
			padding: 1.5rem 1.25rem;
		}

		.landing__brand {
			padding: 0.75rem 1rem;
			gap: 0.75rem;
		}

		.landing__actions {
			flex-direction: column;
			align-items: stretch;
		}

		.action {
			min-width: unset;
			justify-content: center;
		}

		.landing__meta {
			grid-template-columns: 1fr;
		}

		.menu-card {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
			padding: 1.25rem;
		}

		.card-content {
			align-items: center;
		}

		.stats-preview {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.stat-item {
			padding: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.landing {
			padding: 1rem 0.75rem;
		}

		.brand-text {
			display: none;
		}

		.landing__brand {
			padding: 0.5rem;
			justify-content: center;
		}

		h1 {
			text-align: center;
		}

		.hero-content {
			text-align: center;
		}
	}

	/* Accessibility & Interactions */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}

	@media (hover: none) {
		.menu-card:hover,
		.action:hover,
		.meta-item:hover,
		.stat-item:hover,
		.landing__hero:hover,
		.landing__menu:hover {
			transform: none;
		}
	}
</style>
