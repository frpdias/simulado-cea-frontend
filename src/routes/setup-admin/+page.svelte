<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;
  const supabase = data.supabase;

  let loading = false;
  let message = '';
  let error = '';
  let user: any = null;
  let adminStatus: any = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    
    // Verificar status de admin
    try {
      const response = await fetch('/api/admin-check');
      adminStatus = await response.json();
    } catch (e) {
      console.error('Erro ao verificar status de admin:', e);
    }
  });

  async function makeAdmin() {
    loading = true;
    error = '';
    message = '';
    
    try {
      const response = await fetch('/api/make-admin', { method: 'POST' });
      const result = await response.json();
      
      if (response.ok) {
        message = result.message;
        // Recarregar status
        const checkResponse = await fetch('/api/admin-check');
        adminStatus = await checkResponse.json();
      } else {
        error = result.error || 'Erro desconhecido';
      }
    } catch (e) {
      error = 'Erro de conexão: ' + String(e);
    } finally {
      loading = false;
    }
  }

  function goToAdmin() {
    goto('/admin');
  }

  function goToDashboard() {
    goto('/painel');
  }
</script>

<svelte:head>
  <title>Setup Admin - Simulado CEA</title>
</svelte:head>

<div class="setup-container">
  <div class="setup-card">
    <h1>🔧 Setup de Administrador</h1>
    
    {#if user}
      <div class="user-info">
        <h2>👤 Usuário Atual</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Criado em:</strong> {new Date(user.created_at).toLocaleString('pt-BR')}</p>
      </div>
    {/if}

    {#if adminStatus}
      <div class="admin-status">
        <h2>📊 Status Administrativo</h2>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">É Admin por Email:</span>
            <span class="value {adminStatus.adminConfig?.isAdminByEmail ? 'yes' : 'no'}">
              {adminStatus.adminConfig?.isAdminByEmail ? '✅ Sim' : '❌ Não'}
            </span>
          </div>
          
          <div class="status-item">
            <span class="label">Papel na Tabela:</span>
            <span class="value {adminStatus.userData?.papel === 'admin' ? 'yes' : 'no'}">
              {adminStatus.userData?.papel || '❌ Não definido'}
            </span>
          </div>
          
          <div class="status-item">
            <span class="label">Emails Admin Configurados:</span>
            <span class="value {adminStatus.adminConfig?.adminEmailsConfigured ? 'yes' : 'no'}">
              {adminStatus.adminConfig?.adminEmailsConfigured ? '✅ Sim' : '❌ Não'}
            </span>
          </div>
        </div>
        
        {#if adminStatus.adminConfig?.adminEmailsList?.length > 0}
          <div class="admin-emails">
            <strong>Lista de Emails Admin:</strong>
            <ul>
              {#each adminStatus.adminConfig.adminEmailsList as email}
                <li>{email}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}

    <div class="actions">
      <h2>🚀 Ações</h2>
      
      <button 
        class="btn-primary" 
        on:click={makeAdmin}
        disabled={loading}
      >
        {loading ? '⏳ Processando...' : '👑 Tornar-me Admin'}
      </button>
      
      <button class="btn-secondary" on:click={goToAdmin}>
        🛡️ Ir para Painel Admin
      </button>
      
      <button class="btn-secondary" on:click={goToDashboard}>
        📊 Voltar ao Dashboard
      </button>
    </div>

    {#if message}
      <div class="message success">
        ✅ {message}
      </div>
    {/if}

    {#if error}
      <div class="message error">
        ❌ {error}
      </div>
    {/if}

    <div class="debug-info">
      <h3>🔍 Debug Info</h3>
      <details>
        <summary>Ver dados completos</summary>
        <pre>{JSON.stringify(adminStatus, null, 2)}</pre>
      </details>
    </div>
  </div>
</div>

<style>
  .setup-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .setup-card {
    background: rgba(30, 41, 59, 0.9);
    border-radius: 1rem;
    padding: 2rem;
    max-width: 600px;
    width: 100%;
    color: white;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  h2 {
    margin: 1.5rem 0 1rem 0;
    font-size: 1.25rem;
    color: #e2e8f0;
  }

  .user-info, .admin-status, .actions {
    background: rgba(15, 23, 42, 0.7);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .status-grid {
    display: grid;
    gap: 1rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 0.5rem;
  }

  .label {
    font-weight: 600;
  }

  .value.yes {
    color: #34d399;
  }

  .value.no {
    color: #f87171;
  }

  .admin-emails {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 0.5rem;
  }

  .admin-emails ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .btn-primary, .btn-secondary {
    padding: 1rem 2rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: rgba(71, 85, 105, 0.8);
    color: white;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .btn-secondary:hover {
    background: rgba(100, 116, 139, 0.8);
    transform: translateY(-1px);
  }

  .message {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .message.success {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid #22c55e;
    color: #22c55e;
  }

  .message.error {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    color: #ef4444;
  }

  .debug-info {
    margin-top: 2rem;
  }

  details {
    margin-top: 1rem;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
    color: #94a3b8;
  }

  pre {
    background: rgba(15, 23, 42, 0.8);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    font-size: 0.85rem;
    margin-top: 1rem;
  }
</style>