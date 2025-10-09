<main class="center">
	<div class="card glass">
		<div class="logo-bg">
			<img src="https://zcrzyhdzjanivracmoub.supabase.co/storage/v1/object/public/public-assets/logo5.png" alt="Logo da empresa" class="logo-integrada" />
		</div>
		<h1 class="titulo-destaque">Bem-vindo ao Simulado CEA!</h1>
		<nav class="menu-principal">
			<a href="/login" class="menu-link">Login</a>
			<a href="/cadastro" class="menu-link">Cadastro</a>
			<a href="/pagamento" class="menu-link">Pagamento</a>
			<a href="/admin" class="menu-link">Painel Admin</a>
		</nav>
		<p>Escolha uma opção no menu para começar.</p>
	</div>
</main>
<style>
	.menu-principal {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.2rem;
		margin: 1.5rem 0 0.5rem 0;
	}
	.menu-link {
		background: linear-gradient(90deg, #ff8800 60%, #6366f1 100%);
		color: #fff;
		padding: 0.7em 1.5em;
		border-radius: 18px;
		font-weight: 600;
		font-size: 1.1em;
		text-decoration: none;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		transition: background 0.2s, color 0.2s, filter 0.2s;
	}
	.menu-link:hover {
		filter: brightness(1.08);
		opacity: 0.92;
	}
	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		background: #f6f6f6;
	}
	.logo-bg {
		width: 100vw;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: -2rem;
		position: relative;
		z-index: 0;
	}
	.logo-integrada {
		max-width: 180px;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 4px 32px #ff8800aa);
		background: transparent;
		border-radius: 0;
		box-shadow: none;
		margin-top: 2rem;
		margin-bottom: 0.5rem;
	}
	.card.glass {
		background: rgba(255,255,255,0.7);
		border-radius: 24px;
		box-shadow: 0 8px 32px rgba(0,0,0,0.12);
		padding: 2.5rem 2rem 2rem 2rem;
		max-width: 420px;
		margin: 2rem auto;
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255,255,255,0.3);
	}
	.titulo-destaque, h1 {
		color: #111;
		text-shadow: 0 2px 8px rgba(0,0,0,0.12);
		font-weight: 700;
		text-align: center;
		margin-bottom: 1.5rem;
		letter-spacing: 0.5px;
		font-size: 2em;
	}
	p {
		margin-top: 1rem;
		text-align: center;
		font-weight: 500;
		color: #222;
		font-size: 1.1em;
	}
	button {
		width: 100%;
		margin-top: 1rem;
		font-size: 1.1em;
		background: linear-gradient(90deg, #bdbdbd 70%, #ff8800 100%);
		color: #fff;
		border: none;
		font-weight: 600;
		border-radius: 32px;
		box-shadow: 0 2px 8px #bdbdbd;
		transition: background 0.4s, transform 0.1s;
		position: relative;
		overflow: hidden;
	}
	button::after {
		content: "";
		position: absolute;
		left: 0; top: 0; right: 0; bottom: 0;
		background: linear-gradient(120deg, #ff8800 0%, #bdbdbd 100%);
		opacity: 0;
		transition: opacity 0.4s;
		z-index: 0;
	}
	button:hover::after {
		opacity: 0.2;
	}
	button:active {
		transform: scale(0.97);
		box-shadow: 0 1px 4px #bdbdbd;
	}
	button > span {
		position: relative;
		z-index: 1;
	}
	@media (max-width: 600px) {
		.card.glass {
			padding: 1rem;
			max-width: 95vw;
		}
		h1 {
			font-size: 1.3em;
		}
		.logo-integrada {
			max-width: 80px;
		}
	}
</style>