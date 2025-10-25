<script lang="ts">
  import type { LayoutData } from './$types';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  export let data: LayoutData;
  
  async function logout() {
    try {
      // Implementar logout se necessário
      await goto('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }
</script>

<svelte:head>
  <title>Painel Administrativo - Simulado CEA</title>
</svelte:head>

<div class="admin-layout">
  <header class="admin-header">
    <div class="header-content">
      <div class="header-brand">
        <div class="brand-icon">🛡️</div>
        <div class="brand-text">
          <h1>Painel Administrativo</h1>
          <p>Sistema de gestão completo</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="user-info">
          <div class="user-avatar">
            {data.user.nome.charAt(0).toUpperCase()}
          </div>
          <div class="user-details">
            <span class="user-name">{data.user.nome}</span>
            <span class="user-role">Administrador</span>
          </div>
        </div>
        <button class="logout-btn" on:click={logout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </div>
  </header>
  
  <main class="admin-content">
    <slot />
  </main>
</div>

<style>
  .admin-layout {
    min-height: 100vh;
    background: var(--surface-main);
    color: var(--text-primary);
  }
  
  .admin-header {
    background: var(--surface-glass);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-soft);
    padding: var(--spacing-lg) var(--container-padding);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .header-content {
    max-width: var(--container-max-width);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-lg);
  }
  
  .header-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .brand-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(29, 78, 216, 0.3));
  }
  
  .brand-text h1 {
    margin: 0;
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }
  
  .brand-text p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    opacity: 0.8;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--surface-card);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-soft);
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: white;
    font-size: var(--text-base);
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .user-name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .user-role {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    opacity: 0.8;
  }
  
  .logout-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: transparent;
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .logout-btn:hover {
    background: var(--surface-card);
    color: var(--text-primary);
    border-color: var(--brand-primary);
  }
  
  .admin-content {
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: var(--spacing-2xl) var(--container-padding);
  }
  
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
    
    .user-info {
      flex: 1;
    }
  }
</style>
