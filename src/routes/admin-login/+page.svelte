<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;
  const supabase = data.supabase;

  let loading = false;
  let error = '';
  let email = '';
  let senha = '';

  const logoFrUrl = '/FULLSTACK3.png';

  onMount(async () => {
    // Verificar se já está logado
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      goto('/admin');
    }
  });

  async function fazerLogin() {
    if (!email || !senha) {
      error = 'Por favor, preencha todos os campos';
      return;
    }

    loading = true;
    error = '';

    try {
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (loginError) {
        error = loginError.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : loginError.message;
        return;
      }

      const redirectTo = $page.url.searchParams.get('redirectTo');
      const destino = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/admin';
      
      await goto(destino, { replaceState: true });
      
    } catch (err) {
      error = 'Erro inesperado. Tente novamente.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login Administrador - Simulado CEA</title>
</svelte:head>

<div class="auth">
  <aside class="auth__aside">
    <div class="aside-content">
      <div class="brand-section">
        <img src={logoFrUrl} alt="FullStack Educacional" class="brand-logo" />
        <div class="brand-text">
          <h1>Painel Administrativo</h1>
          <p>Sistema de gestão completo e seguro para administradores</p>
        </div>
      </div>
      
      <div class="features-list">
        <div class="feature-item">
          <div class="feature-icon">🛡️</div>
          <div class="feature-content">
            <h3>Acesso Seguro</h3>
            <p>Autenticação robusta e monitoramento de segurança</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-content">
            <h3>Dashboard Completo</h3>
            <p>Métricas em tempo real e relatórios detalhados</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">⚙️</div>
          <div class="feature-content">
            <h3>Gestão Total</h3>
            <p>Controle completo sobre usuários e configurações</p>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <section class="auth__card">
    <div class="card-header">
      <div class="header-content">
        <h2>Acesso Administrativo</h2>
        <p>Faça login com suas credenciais de administrador</p>
      </div>
      <div class="header-decoration"></div>
    </div>

    {#if error}
      <div class="auth__alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>Acesso Negado</strong>
          <span>{error}</span>
        </div>
      </div>
    {/if}

    <form class="auth__form" on:submit|preventDefault={fazerLogin}>
      <div class="field-group">
        <label class="field">
          <span class="field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email do Administrador
          </span>
          <div class="input-wrapper">
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="admin@exemplo.com"
              autocomplete="email"
              required
              disabled={loading}
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
            Senha de Administrador
          </span>
          <div class="input-wrapper">
            <input
              id="senha"
              type="password"
              bind:value={senha}
              placeholder="••••••••"
              autocomplete="current-password"
              required
              disabled={loading}
            />
            <div class="input-focus-line"></div>
          </div>
        </label>
      </div>

      <button type="submit" class="submit-button" disabled={loading}>
        {#if loading}
          <div class="loading-spinner"></div>
          <span>Verificando credenciais...</span>
        {:else}
          <span>Acessar Painel Admin</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        {/if}
      </button>
    </form>

    <footer class="auth-footer">
      <div class="footer-divider">
        <span>Acesso para usuários?</span>
      </div>
      <a href="/login" class="register-link">
        <span>Login de Usuário</span>
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

  .auth__aside {
    display: flex;
    flex-direction: column;
    justify-content: center;
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
    position: relative;
    overflow: hidden;
  }

  .aside-content {
    display: flex;
    flex-direction: column;
    gap: clamp(2rem, 4vw, 3rem);
    position: relative;
    z-index: 1;
  }

  .brand-section {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.5rem);
  }

  .brand-logo {
    width: clamp(120px, 15vw, 180px);
    height: clamp(120px, 15vw, 180px);
    object-fit: contain;
    filter: drop-shadow(0 12px 24px rgba(59, 130, 246, 0.6)) brightness(1.15);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    padding: 12px;
  }

  .brand-text h1 {
    margin: 0 0 clamp(0.5rem, 1vw, 0.75rem) 0;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    font-weight: 800;
    color: var(--text-primary);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .brand-text p {
    margin: 0;
    color: var(--text-secondary);
    font-size: clamp(0.95rem, 1.8vw, 1.15rem);
    line-height: 1.7;
    max-width: 90%;
  }

  .features-list {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.5rem);
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem);
    background: rgba(15, 23, 42, 0.7);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .feature-icon {
    font-size: clamp(1.5rem, 3vw, 2rem);
    filter: drop-shadow(0 4px 8px rgba(29, 78, 216, 0.3));
  }

  .feature-content h3 {
    margin: 0 0 clamp(0.25rem, 0.5vw, 0.5rem) 0;
    font-size: clamp(1rem, 2vw, 1.2rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  .feature-content p {
    margin: 0;
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .auth__card {
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(20px);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    padding: clamp(1.5rem, 3vw, 2.5rem);
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2rem);
    position: relative;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    flex-direction: column;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    position: relative;
    padding-bottom: clamp(0.75rem, 1.5vw, 1rem);
  }

  .card-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  .header-content h2 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    color: var(--text-primary);
  }

  .header-content p {
    margin: 0;
    color: var(--text-secondary);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    line-height: 1.6;
  }

  .header-decoration {
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
    border-radius: 2px;
  }

  .auth__alert {
    display: flex;
    align-items: flex-start;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem);
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    backdrop-filter: blur(10px);
  }

  .alert-icon {
    font-size: clamp(1.2rem, 2.4vw, 1.5rem);
    flex-shrink: 0;
  }

  .alert-content {
    display: flex;
    flex-direction: column;
    gap: clamp(0.25rem, 0.5vw, 0.5rem);
    flex: 1;
  }

  .alert-content strong {
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  .alert-content span {
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .auth__form {
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2rem);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.5rem);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .field-label svg {
    opacity: 0.7;
    flex-shrink: 0;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  input {
    width: 100%;
    padding: clamp(0.875rem, 1.75vw, 1.125rem) clamp(1rem, 2vw, 1.25rem);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    background: rgba(15, 23, 42, 0.8);
    color: var(--text-primary);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  input:focus {
    outline: none;
    border-color: var(--brand-primary);
    background: rgba(15, 23, 42, 0.9);
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }

  input::placeholder {
    color: rgba(148, 163, 184, 0.5);
  }

  .input-focus-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
    transform: scaleX(0);
    transition: transform 0.3s ease;
    border-radius: 1px;
  }

  input:focus ~ .input-focus-line {
    transform: scaleX(1);
  }

  .submit-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(1rem, 2vw, 1.25rem) clamp(1.5rem, 3vw, 2rem);
    background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    color: white;
    border: none;
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    font-size: clamp(0.95rem, 1.9vw, 1.1rem);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(29, 78, 216, 0.4);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
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
    gap: clamp(1rem, 2vw, 1.5rem);
    padding-top: clamp(1rem, 2vw, 1.5rem);
    border-top: 1px solid rgba(148, 163, 184, 0.1);
  }

  .footer-divider {
    text-align: center;
  }

  .footer-divider span {
    color: var(--text-muted);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    padding: 0 clamp(1rem, 2vw, 1.5rem);
    background: var(--surface-card);
  }

  .register-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.75rem, 1.5vw, 1rem);
    color: var(--brand-primary);
    text-decoration: none;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    font-weight: 500;
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    transition: all 0.3s ease;
  }

  .register-link:hover {
    background: rgba(29, 78, 216, 0.1);
    color: var(--brand-secondary);
  }

  @media (max-width: 1024px) {
    .auth {
      grid-template-columns: 1fr;
      gap: clamp(1.5rem, 3vw, 2rem);
    }

    .auth__aside {
      order: 2;
    }

    .auth__card {
      order: 1;
    }
  }

  @media (max-width: 640px) {
    .auth {
      padding: clamp(0.75rem, 2vw, 1rem);
    }

    .features-list {
      display: none;
    }
  }
</style>