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
      // Se já está logado, tentar ir direto para admin
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
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (loginError) {
        error = loginError.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : loginError.message;
        return;
      }

      // Login bem-sucedido - redirecionar para admin
      // Usar o mesmo padrão do login regular
      const redirectTo = $page.url.searchParams.get('redirectTo');
      const destino = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/admin';
      await goto(destino, { replaceState: true });
      
    } catch (err) {
      error = 'Erro inesperado. Tente novamente.';
      console.error('Erro no login admin:', err);
    } finally {
      loading = false;
    }
  }

  function voltarHome() {
    goto('/');
  }

  function irParaLoginRegular() {
    goto('/login');
  }
</script>

<svelte:head>
  <title>Login Administrador - Simulado CEA</title>
</svelte:head>

<main class="login-admin-container">
  <div class="login-admin-card">
    <!-- Header com logo e título -->
    <div class="admin-header">
      <img src={logoFrUrl} alt="FullStack Educacional" class="admin-logo" />
      <div class="admin-title">
        <h1>🛡️ Painel Administrativo</h1>
        <p>Acesso exclusivo para administradores</p>
      </div>
    </div>

    <!-- Formulário de login -->
    <form on:submit|preventDefault={fazerLogin} class="admin-form">
      <div class="form-group">
        <label for="email">Email do Administrador</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="admin@exemplo.com"
          required
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="senha">Senha</label>
        <input
          id="senha"
          type="password"
          bind:value={senha}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>

      {#if error}
        <div class="error-message">
          ❌ {error}
        </div>
      {/if}

      <button type="submit" class="btn-admin-login" disabled={loading}>
        {#if loading}
          <span class="loading-spinner"></span>
          Verificando...
        {:else}
          <span class="login-icon">🔐</span>
          Acessar Painel Admin
        {/if}
      </button>
    </form>

    <!-- Links de navegação -->
    <div class="admin-links">
      <button type="button" class="link-button" on:click={irParaLoginRegular}>
        👤 Login de Usuário Regular
      </button>
      
      <button type="button" class="link-button" on:click={voltarHome}>
        🏠 Voltar ao Início
      </button>
    </div>

    <!-- Informações de segurança -->
    <div class="security-info">
      <div class="security-badge">
        <span class="security-icon">🔒</span>
        <div class="security-text">
          <strong>Área Restrita</strong>
          <small>Acesso monitorado e registrado</small>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .login-admin-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #111827 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .login-admin-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
    pointer-events: none;
  }

  .login-admin-card {
    background: rgba(30, 41, 59, 0.95);
    border-radius: 1.5rem;
    padding: 3rem;
    width: 100%;
    max-width: 480px;
    position: relative;
    z-index: 1;
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
  }

  .admin-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .admin-logo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 1rem;
    border: 3px solid rgba(168, 85, 247, 0.3);
    padding: 0.5rem;
    background: rgba(168, 85, 247, 0.1);
  }

  .admin-title h1 {
    color: #f8fafc;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #a855f7, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .admin-title p {
    color: #94a3b8;
    margin: 0;
    font-size: 0.95rem;
  }

  .admin-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    color: #e2e8f0;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 1rem 1.25rem;
    border: 2px solid rgba(100, 116, 139, 0.3);
    border-radius: 0.75rem;
    background: rgba(15, 23, 42, 0.8);
    color: #f8fafc;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    background: rgba(15, 23, 42, 0.9);
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-group input::placeholder {
    color: #64748b;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    padding: 1rem;
    border-radius: 0.75rem;
    font-size: 0.9rem;
    text-align: center;
  }

  .btn-admin-login {
    background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
    color: white;
    border: none;
    padding: 1.25rem 2rem;
    border-radius: 0.75rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
  }

  .btn-admin-login:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px rgba(168, 85, 247, 0.4);
  }

  .btn-admin-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .login-icon {
    font-size: 1.2rem;
  }

  .admin-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .link-button {
    background: none;
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: #94a3b8;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }

  .link-button:hover {
    background: rgba(100, 116, 139, 0.1);
    color: #e2e8f0;
    border-color: rgba(100, 116, 139, 0.5);
  }

  .security-info {
    border-top: 1px solid rgba(100, 116, 139, 0.2);
    padding-top: 1.5rem;
  }

  .security-badge {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(15, 23, 42, 0.6);
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(100, 116, 139, 0.2);
  }

  .security-icon {
    font-size: 1.5rem;
  }

  .security-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .security-text strong {
    color: #e2e8f0;
    font-size: 0.9rem;
  }

  .security-text small {
    color: #64748b;
    font-size: 0.8rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .login-admin-container {
      padding: 1rem;
    }

    .login-admin-card {
      padding: 2rem;
    }

    .admin-title h1 {
      font-size: 1.5rem;
    }

    .btn-admin-login {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }
</style>