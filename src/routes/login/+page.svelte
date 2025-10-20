<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import type { PageData } from './$types';

  const logoUrl =
    'https://zcrzyhdzjanivracmoub.supabase.co/storage/v1/object/public/public-assets/logo5.png';

  export let data: PageData;
  const supabase = data.supabase;

  let email = '';
  let senha = '';
  let error = '';
  let loading = false;

  async function realizarLogin() {
    error = '';
    loading = true;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (signInError) {
        throw signInError;
      }

      const currentPage = get(page);
      const redirectTo = currentPage.url.searchParams.get('redirectTo');
      const destino = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/painel';
      await goto(destino, { replaceState: true });
    } catch (err: any) {
      error = err?.message ?? 'Não foi possível entrar. Tente novamente.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth auth--login">
  <div class="auth-background">
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>
  </div>

  <aside class="auth__panel">
    <div class="panel-content">
      <div class="auth__brand">
        <div class="brand-logo">
          <img src={logoUrl} alt="FR Educacional" loading="lazy" />
          <div class="logo-glow"></div>
        </div>
        <div class="brand-text">
          <span>Simulado CEA</span>
          <small>ANBIMA Certificação</small>
        </div>
      </div>

      <div class="panel-hero">
        <h1>Bem-vindo de volta</h1>
        <p>
          Faça login para acompanhar seu desempenho e continuar os simulados personalizados que preparamos para você.
        </p>

        <div class="stats-preview">
          <div class="stat-mini">
            <span class="stat-icon">📊</span>
            <span class="stat-text">Dashboard personalizado</span>
          </div>
          <div class="stat-mini">
            <span class="stat-icon">📈</span>
            <span class="stat-text">Progresso em tempo real</span>
          </div>
          <div class="stat-mini">
            <span class="stat-icon">🎯</span>
            <span class="stat-text">Simulados direcionados</span>
          </div>
        </div>
      </div>

      <ul class="auth__highlights">
        <li>
          <div class="highlight-icon">✓</div>
          <span>Resultados atualizados em tempo real</span>
        </li>
        <li>
          <div class="highlight-icon">✓</div>
          <span>Histórico completo de simulados</span>
        </li>
        <li>
          <div class="highlight-icon">✓</div>
          <span>Filtros por tema e inteligência de estudos</span>
        </li>
      </ul>
    </div>
  </aside>

  <section class="auth__card">
    <div class="card-header">
      <div class="header-content">
        <h2>Entrar na plataforma</h2>
        <p>Acesse com seu e-mail cadastrado para retomar seus estudos.</p>
      </div>
      <div class="header-decoration"></div>
    </div>

    {#if error}
      <div class="auth__alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>Ops! Algo deu errado</strong>
          <span>{error}</span>
        </div>
      </div>
    {/if}

    <form class="auth__form" on:submit|preventDefault={realizarLogin}>
      <div class="field-group">
        <label class="field">
          <span class="field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            E-mail profissional
          </span>
          <div class="input-wrapper">
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="nome@empresa.com"
              autocomplete="email"
              required
            />
            <div class="input-focus-line"></div>
          </div>
        </label>

        <label class="field">
          <span class="field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Senha
          </span>
          <div class="input-wrapper">
            <input
              id="senha"
              type="password"
              bind:value={senha}
              placeholder="Mínimo 6 caracteres"
              minlength="6"
              autocomplete="current-password"
              required
            />
            <div class="input-focus-line"></div>
          </div>
        </label>
      </div>

      <button type="submit" class="submit-button" disabled={loading}>
        {#if loading}
          <div class="loading-spinner"></div>
          <span>Validando dados...</span>
        {:else}
          <span>Entrar</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        {/if}
      </button>
    </form>

    <footer class="auth-footer">
      <div class="footer-divider">
        <span>Não tem uma conta?</span>
      </div>
      <a href="/cadastro" class="register-link">
        <span>Crie agora mesmo</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </footer>
  </section>
</div>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  .auth {
    min-height: calc(100vh - 4rem);
    padding: clamp(1rem, 3vw, 2.5rem);
    display: grid;
    grid-template-columns: minmax(300px, 1fr) minmax(320px, 450px);
    gap: clamp(2rem, 5vw, 4rem);
    align-items: stretch;
    position: relative;
    background: 
      radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
      linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 1) 100%);
  }

  .auth-background {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .floating-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.6;
    animation: float 8s ease-in-out infinite;
  }

  .shape-1 {
    width: clamp(200px, 30vw, 400px);
    height: clamp(200px, 30vw, 400px);
    top: -10%;
    right: -10%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent 70%);
    animation-delay: 0s;
  }

  .shape-2 {
    width: clamp(150px, 25vw, 300px);
    height: clamp(150px, 25vw, 300px);
    bottom: -10%;
    left: -10%;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.3), transparent 70%);
    animation-delay: -4s;
  }

  .shape-3 {
    width: clamp(100px, 20vw, 200px);
    height: clamp(100px, 20vw, 200px);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(14, 165, 233, 0.2), transparent 70%);
    animation-delay: -2s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    33% { transform: translateY(-15px) scale(1.05); }
    66% { transform: translateY(15px) scale(0.95); }
  }

  .auth__panel {
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.85);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    padding: clamp(1.5rem, 3vw, 2.6rem);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .panel-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2rem);
    height: 100%;
  }

  .auth__brand {
    display: inline-flex;
    align-items: center;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    background: 
      linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.25rem);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 10px 25px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.2);
    max-width: fit-content;
  }

  .brand-logo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-logo img {
    width: clamp(40px, 6vw, 56px);
    height: clamp(40px, 6vw, 56px);
    object-fit: contain;
    filter: drop-shadow(0 8px 16px rgba(59, 130, 246, 0.4));
    position: relative;
    z-index: 2;
  }

  .logo-glow {
    position: absolute;
    inset: 0;
    background: rgba(99, 102, 241, 0.3);
    border-radius: 50%;
    animation: glow 3s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .brand-text span {
    font-size: clamp(0.9rem, 1.8vw, 1.1rem);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-primary);
    font-weight: 700;
    background: linear-gradient(135deg, #fff 0%, rgba(148, 163, 184, 0.9) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-text small {
    font-size: clamp(0.7rem, 1.4vw, 0.8rem);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  .panel-hero {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.5rem);
    flex: 1;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    line-height: 1.2;
    font-weight: 800;
    color: var(--text-primary);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .panel-hero p {
    margin: 0;
    color: var(--text-secondary);
    font-size: clamp(0.95rem, 1.8vw, 1.15rem);
    line-height: 1.7;
    max-width: 90%;
  }

  .stats-preview {
    display: grid;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    margin: clamp(1rem, 2vw, 1.5rem) 0;
  }

  .stat-mini {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.75rem, 1.5vw, 1rem);
    background: rgba(15, 23, 42, 0.7);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    border: 1px solid rgba(99, 102, 241, 0.2);
    transition: all 0.3s ease;
  }

  .stat-mini:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
  }

  .stat-icon {
    font-size: clamp(1.2rem, 2.5vw, 1.5rem);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .stat-text {
    color: var(--text-secondary);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    font-weight: 500;
  }

  .auth__highlights {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: clamp(0.75rem, 1.5vw, 1rem);
  }

  .auth__highlights li {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.75rem, 1.5vw, 1rem);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    background: rgba(15, 23, 42, 0.8);
    color: var(--text-secondary);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    border: 1px solid rgba(34, 197, 94, 0.3);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(34, 197, 94, 0.1);
    transition: all 0.3s ease;
  }

  .auth__highlights li:hover {
    transform: translateY(-1px);
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 8px 16px rgba(34, 197, 94, 0.2);
  }

  .highlight-icon {
    width: clamp(20px, 3vw, 24px);
    height: clamp(20px, 3vw, 24px);
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: clamp(10px, 1.5vw, 12px);
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
  }

  .auth__card {
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    padding: clamp(1.5rem, 3vw, 2.5rem);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: clamp(1.25rem, 2.5vw, 1.5rem);
    max-width: 100%;
    width: 100%;
    justify-self: center;
    position: relative;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.25rem);
    position: relative;
  }

  .header-content h2 {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 1.8rem);
    font-weight: 700;
    color: var(--text-primary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .header-content p {
    margin: clamp(0.5rem, 1vw, 0.75rem) 0 0;
    color: var(--text-muted);
    line-height: 1.6;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
  }

  .header-decoration {
    height: 3px;
    background: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    border-radius: 2px;
    opacity: 0.8;
  }

  .auth__alert {
    background: 
      linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(248, 113, 113, 0.15) 100%);
    border: 1px solid rgba(248, 113, 113, 0.4);
    color: #fecaca;
    padding: clamp(1rem, 2vw, 1.25rem);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    display: flex;
    align-items: flex-start;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
  }

  .alert-icon {
    font-size: clamp(1.2rem, 2.5vw, 1.5rem);
    flex-shrink: 0;
  }

  .alert-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  .alert-content strong {
    font-weight: 600;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
  }

  .alert-content span {
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    opacity: 0.9;
  }

  .auth__form {
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2rem);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: clamp(1.25rem, 2.5vw, 1.5rem);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    color: var(--text-secondary);
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  .field-label svg {
    color: var(--brand-primary);
    filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3));
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    padding: clamp(1rem, 2vw, 1.25rem) clamp(1rem, 2vw, 1.25rem);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: 
      linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    color: var(--text-primary);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }

  input::placeholder {
    color: rgba(148, 163, 184, 0.6);
  }

  input:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 0 0 3px rgba(99, 102, 241, 0.2),
      0 8px 16px rgba(99, 102, 241, 0.15);
    transform: translateY(-1px);
  }

  .input-focus-line {
    position: absolute;
    bottom: 0;
    left: 50%;
    right: 50%;
    height: 2px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
    border-radius: 1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
  }

  input:focus + .input-focus-line {
    left: 0;
    right: 0;
    opacity: 1;
  }

  .submit-button {
    margin-top: clamp(0.5rem, 1vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem) clamp(1.5rem, 3vw, 2rem);
    border-radius: 999px;
    border: none;
    font-weight: 700;
    font-size: clamp(0.95rem, 1.9vw, 1.1rem);
    background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 20px 40px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    position: relative;
    overflow: hidden;
  }

  .submit-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
  }

  .submit-button:hover::before {
    left: 100%;
  }

  .submit-button:hover:enabled {
    transform: translateY(-3px);
    box-shadow: 
      0 25px 50px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .submit-button:disabled:hover {
    transform: none;
    box-shadow: 
      0 20px 40px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .loading-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .auth-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(1rem, 2vw, 1.25rem);
    padding-top: clamp(1rem, 2vw, 1.5rem);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer-divider {
    color: var(--text-muted);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    text-align: center;
  }

  .register-link {
    display: inline-flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    color: var(--text-primary);
    font-weight: 600;
    text-decoration: none;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1.25rem, 2.5vw, 1.5rem);
    border-radius: 999px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .register-link:hover {
    transform: translateY(-2px);
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);
    text-decoration: none;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .auth {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .auth__panel {
      order: 2;
    }

    .auth__card {
      order: 1;
      max-width: 500px;
      justify-self: center;
    }
  }

  @media (max-width: 768px) {
    .auth {
      padding: 1.5rem 1rem;
    }

    .stats-preview {
      display: none;
    }

    .auth__highlights {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .auth {
      padding: 1rem 0.75rem;
    }

    .auth__panel,
    .auth__card {
      padding: 1.5rem 1.25rem;
    }

    .auth__brand {
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }

    .brand-text {
      align-items: center;
    }

    .field-label svg {
      display: none;
    }

    .submit-button {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .auth__highlights li span {
      font-size: 0.8rem;
    }

    .auth__card {
      padding: 1.25rem 1rem;
    }

    .register-link {
      width: 100%;
      justify-content: center;
    }
  }

  /* Accessibility & Performance */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media (hover: none) {
    .submit-button:hover,
    .register-link:hover,
    .stat-mini:hover,
    .auth__highlights li:hover {
      transform: none;
    }
  }
</style>
