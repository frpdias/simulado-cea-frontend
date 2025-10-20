<script lang="ts">
	const logoUrl =
		'https://zcrzyhdzjanivracmoub.supabase.co/storage/v1/object/public/public-assets/logo5.png';
</script>

<main class="landing">
	<section class="landing__hero">
		<div class="landing__brand">
			<img src={logoUrl} alt="FR Educacional" loading="lazy" />
			<strong>Simulado CEA</strong>
		</div>

		<h1>Treine com segurança, avance com confiança.</h1>
		<p>
			Simulados realistas, monitoramento inteligente e um painel completo para você dominar a
			prova do Certificado de Especialista ANBIMA.
		</p>

		<nav class="landing__actions">
			<a class="action primary" href="/cadastro">Começar agora</a>
			<a class="action secondary" href="/painel">Entrar como aluno</a>
		</nav>

		<div class="landing__meta">
			<span>Questões atualizadas por especialistas</span>
			<span>Sala do administrador integrada</span>
			<span>Estude onde estiver</span>
		</div>
	</section>

	<section class="landing__menu">
		<h2>Navegue rapidamente</h2>

		<div class="landing__grid">
			<a href="/painel" class="menu-card">
				<span class="menu-card__title">Painel do Aluno</span>
				<small>Resumo do desempenho, simulados e filtros por tema</small>
			</a>
			<a href="/login" class="menu-card">
				<span class="menu-card__title">Login</span>
				<small>Acesse sua conta e continue de onde parou</small>
			</a>
			<a href="/cadastro" class="menu-card">
				<span class="menu-card__title">Cadastro</span>
				<small>Crie uma conta e comece a treinar em minutos</small>
			</a>
			<a href="/pagamento" class="menu-card">
				<span class="menu-card__title">Pagamento</span>
				<small>Planos e condições especiais para sua aprovação</small>
			</a>
			<a href="/admin" class="menu-card">
				<span class="menu-card__title">Painel Admin</span>
				<small>Gestão de usuários e acompanhamento em tempo real</small>
			</a>
		</div>
	</section>
</main>

<style>
	.landing {
		min-height: calc(100vh - 4rem);
		padding: 3rem clamp(1.5rem, 4vw, 4.5rem);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: clamp(2rem, 5vw, 4rem);
		position: relative;
	}

	.landing::after,
	.landing::before {
		content: '';
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
		opacity: 0.35;
		z-index: 0;
	}

	.landing::before {
		width: 520px;
		height: 520px;
		top: -160px;
		right: -120px;
		background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.65), transparent 65%);
	}

	.landing::after {
		width: 420px;
		height: 420px;
		bottom: -180px;
		left: -140px;
		background: radial-gradient(circle at 40% 40%, rgba(249, 115, 22, 0.55), transparent 70%);
	}

	.landing__hero,
	.landing__menu {
		position: relative;
		z-index: 1;
		background: var(--surface-glass);
		border: 1px solid var(--border-soft);
		box-shadow: var(--shadow-md);
		border-radius: var(--radius-lg);
		padding: clamp(1.8rem, 3vw, 2.8rem);
		display: flex;
		flex-direction: column;
		gap: clamp(1.25rem, 2.4vw, 1.8rem);
	}

	.landing__brand {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(15, 23, 42, 0.8);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
		max-width: fit-content;
	}

	.landing__brand img {
		width: 48px;
		height: 48px;
		object-fit: contain;
		filter: drop-shadow(0 12px 28px rgba(59, 130, 246, 0.35));
	}

	.landing__brand strong {
		font-weight: 700;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--text-secondary);
	}

	h1 {
		font-size: clamp(2rem, 4vw, 2.8rem);
		line-height: 1.2;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}

	p {
		margin: 0;
		color: var(--text-secondary);
		font-size: clamp(1rem, 1.2vw, 1.15rem);
		line-height: 1.7;
		max-width: 520px;
	}

	.landing__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.9rem 1.8rem;
		border-radius: 999px;
		font-weight: 600;
		letter-spacing: 0.01em;
		text-decoration: none;
		transition: transform 0.18s ease, box-shadow 0.2s ease, background 0.2s ease;
		box-shadow: 0 14px 36px rgba(99, 102, 241, 0.25);
	}

	.action.primary {
		background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
		color: #fff;
	}

	.action.secondary {
		background: rgba(99, 102, 241, 0.12);
		color: var(--text-secondary);
		box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.35);
	}

	.action:hover {
		transform: translateY(-3px);
	}

	.landing__meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.landing__meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.65rem 0.85rem;
		border-radius: var(--radius-sm);
		background: rgba(15, 23, 42, 0.7);
		color: var(--text-muted);
		font-size: 0.9rem;
		box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
	}

	.landing__meta span::before {
		content: '•';
		color: var(--brand-highlight);
		font-size: 1.4rem;
		line-height: 0;
	}

	.landing__menu h2 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.landing__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.15rem;
	}

	.menu-card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 1.4rem 1.2rem;
		border-radius: var(--radius-md);
		background: rgba(15, 23, 42, 0.78);
		border: 1px solid rgba(148, 163, 184, 0.2);
		text-decoration: none;
		color: inherit;
		box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.08);
		transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
	}

	.menu-card:hover {
		transform: translateY(-4px);
		border-color: rgba(99, 102, 241, 0.35);
		box-shadow: 0 16px 38px rgba(99, 102, 241, 0.18);
	}

	.menu-card__title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1.05rem;
	}

	.menu-card small {
		color: var(--text-muted);
		line-height: 1.5;
	}

	@media (max-width: 720px) {
		.landing {
			padding: 2.25rem 1.25rem 3.5rem;
		}

		.landing__hero,
		.landing__menu {
			padding: 1.75rem 1.4rem;
		}

		.landing__meta {
			grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		}
	}
</style>
