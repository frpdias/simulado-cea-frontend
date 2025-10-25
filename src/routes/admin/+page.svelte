<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  
  export let data: PageData;
  
  // Usar data do usuário administrador
  $: userInfo = data.user;
  
  let stats = {
    usuarios: 0,
    simulados: 0,
    status: 'online'
  };
  
  onMount(async () => {
    // Carregar estatísticas (implementar quando necessário)
    stats.usuarios = '--';
    stats.simulados = '--';
  });
</script>

<svelte:head>
  <title>Dashboard - Admin</title>
</svelte:head>

<div class="admin-dashboard">
  <div class="dashboard-header">
    <h2>Dashboard Administrativo</h2>
    <p>Visão geral do sistema e métricas importantes</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-content">
        <h3>Usuários</h3>
        <p class="stat-number">{stats.usuarios}</p>
        <span class="stat-label">Total de usuários</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">📊</div>
      <div class="stat-content">
        <h3>Simulados</h3>
        <p class="stat-number">{stats.simulados}</p>
        <span class="stat-label">Simulados realizados</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">🟢</div>
      <div class="stat-content">
        <h3>Sistema</h3>
        <p class="stat-number">✅</p>
        <span class="stat-label">Status: Online</span>
      </div>
    </div>
  </div>
  
  <div class="actions-section">
    <div class="section-header">
      <h3>Ações Administrativas</h3>
      <p>Ferramentas de gestão e administração</p>
    </div>
    
    <div class="actions-grid">
      <button class="action-card">
        <div class="action-icon">👤</div>
        <div class="action-content">
          <h4>Gerenciar Usuários</h4>
          <p>Visualizar, editar e gerenciar contas de usuários</p>
        </div>
        <div class="action-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </button>
      
      <button class="action-card">
        <div class="action-icon">📈</div>
        <div class="action-content">
          <h4>Relatórios</h4>
          <p>Gerar e visualizar relatórios detalhados</p>
        </div>
        <div class="action-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </button>
      
      <button class="action-card">
        <div class="action-icon">⚙️</div>
        <div class="action-content">
          <h4>Configurações</h4>
          <p>Ajustar configurações do sistema</p>
        </div>
        <div class="action-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </button>
      
      <button class="action-card">
        <div class="action-icon">🔒</div>
        <div class="action-content">
          <h4>Segurança</h4>
          <p>Monitorar logs e atividades de segurança</p>
        </div>
        <div class="action-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </button>
    </div>
  </div>
</div>

<style>
  .admin-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }
  
  .dashboard-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }
  
  .dashboard-header h2 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--text-primary);
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .dashboard-header p {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text-secondary);
    opacity: 0.8;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-2xl);
  }
  
  .stat-card {
    background: var(--surface-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
  }
  
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--brand-primary);
  }
  
  .stat-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(29, 78, 216, 0.3));
  }
  
  .stat-content {
    flex: 1;
  }
  
  .stat-content h3 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .stat-number {
    margin: var(--spacing-sm) 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--brand-primary);
    line-height: 1;
  }
  
  .stat-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    opacity: 0.8;
  }
  
  .actions-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }
  
  .section-header {
    text-align: center;
  }
  
  .section-header h3 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .section-header p {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text-secondary);
    opacity: 0.8;
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .action-card {
    background: var(--surface-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    width: 100%;
  }
  
  .action-card:hover {
    transform: translateY(-2px);
    background: var(--surface-glass);
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-md);
  }
  
  .action-icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(29, 78, 216, 0.2));
  }
  
  .action-content {
    flex: 1;
  }
  
  .action-content h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .action-content p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    opacity: 0.8;
    line-height: 1.4;
  }
  
  .action-arrow {
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }
  
  .action-card:hover .action-arrow {
    color: var(--brand-primary);
    transform: translateX(4px);
  }
  
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .actions-grid {
      grid-template-columns: 1fr;
    }
    
    .stat-card,
    .action-card {
      padding: var(--spacing-lg);
    }
  }
</style>
