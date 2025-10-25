<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  
  export let data: PageData;
  
  // Usar data do usuário administrador
  $: userInfo = data.user;
  $: usuarios = data.usuarios || [];
  $: stats = data.stats || { totalUsuarios: 0, totalSimulados: 0, usuariosAtivos: 0 };
  
  // Estado para loading e feedback
  let actionLoading: { [key: string]: boolean } = {};
  let actionMessages: { [key: string]: string } = {};
  
  function formatDate(dateString: string) {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getStatusClass(lastSignIn: string) {
    if (!lastSignIn) return 'status-never';
    const daysSince = (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) return 'status-active';
    if (daysSince <= 30) return 'status-recent';
    return 'status-inactive';
  }
  
  function getStatusText(lastSignIn: string) {
    if (!lastSignIn) return 'Nunca acessou';
    const daysSince = (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 1) return 'Online';
    if (daysSince <= 7) return 'Ativo';
    if (daysSince <= 30) return 'Recente';
    return 'Inativo';
  }
  
  // Calcular dias restantes para expiração (30 dias desde último acesso)
  function getDaysRemaining(lastSignIn: string) {
    if (!lastSignIn) return 30; // Se nunca acessou, tem 30 dias
    const daysSince = (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24);
    const remaining = 30 - Math.floor(daysSince);
    return Math.max(0, remaining);
  }
  
  function getExpirationStatus(daysRemaining: number) {
    if (daysRemaining <= 3) return 'expiring-soon';
    if (daysRemaining <= 7) return 'expiring-warning';
    return 'expiring-normal';
  }
  
  // Ações do usuário
  async function updateUserStatus(userId: string, newStatus: 'ativo' | 'suspenso' | 'inativo') {
    const actionKey = `status-${userId}`;
    actionLoading[actionKey] = true;
    
    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          action: 'updateStatus',
          status: newStatus
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Atualizar o usuário na lista local
        usuarios = usuarios.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        );
        actionMessages[actionKey] = `Status atualizado para ${newStatus}`;
        setTimeout(() => delete actionMessages[actionKey], 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      actionMessages[actionKey] = `Erro: ${error.message}`;
      setTimeout(() => delete actionMessages[actionKey], 3000);
    } finally {
      actionLoading[actionKey] = false;
    }
  }
  
  async function deleteUser(userId: string, userEmail: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    const actionKey = `delete-${userId}`;
    actionLoading[actionKey] = true;
    
    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remover o usuário da lista local
        usuarios = usuarios.filter(u => u.id !== userId);
        stats.totalUsuarios = usuarios.length;
        actionMessages[actionKey] = 'Usuário excluído com sucesso';
        setTimeout(() => delete actionMessages[actionKey], 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      actionMessages[actionKey] = `Erro: ${error.message}`;
      setTimeout(() => delete actionMessages[actionKey], 3000);
    } finally {
      actionLoading[actionKey] = false;
    }
  }
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
        <p class="stat-number">{stats.totalUsuarios}</p>
        <span class="stat-label">Total de usuários</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">📊</div>
      <div class="stat-content">
        <h3>Simulados</h3>
        <p class="stat-number">{stats.totalSimulados}</p>
        <span class="stat-label">Simulados realizados</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">🟢</div>
      <div class="stat-content">
        <h3>Ativos</h3>
        <p class="stat-number">{stats.usuariosAtivos}</p>
        <span class="stat-label">Usuários ativos</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">⚡</div>
      <div class="stat-content">
        <h3>Sistema</h3>
        <p class="stat-number status-online">Online</p>
        <span class="stat-label">Status do sistema</span>
      </div>
    </div>
  </div>
  
  <!-- Lista de Usuários -->
  <div class="users-section">
    <div class="section-header">
      <h3>Usuários Cadastrados</h3>
      <p>Gerencie todos os usuários do sistema</p>
    </div>
    
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Status</th>
            <th>Último Acesso</th>
            <th>Validade (30 dias)</th>
            <th>Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each usuarios as usuario}
            {@const daysRemaining = getDaysRemaining(usuario.last_sign_in_at)}
            {@const userStatus = usuario.status || 'ativo'}
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar-small">
                    {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span class="user-name">{usuario.nome || 'Nome não informado'}</span>
                </div>
              </td>
              <td class="email-cell">{usuario.email}</td>
              <td>{usuario.telefone || usuario.whatsapp || 'Não informado'}</td>
              <td>
                <span class="user-status-badge status-{userStatus}">
                  {#if userStatus === 'ativo'}✅ Ativo
                  {:else if userStatus === 'suspenso'}⚠️ Suspenso
                  {:else}❌ Inativo
                  {/if}
                </span>
              </td>
              <td class="date-cell">{formatDate(usuario.last_sign_in_at)}</td>
              <td>
                <div class="expiration-cell">
                  <span class="days-remaining {getExpirationStatus(daysRemaining)}">
                    {daysRemaining} dias
                  </span>
                  {#if daysRemaining <= 3}
                    <span class="expiration-warning">⚠️</span>
                  {/if}
                </div>
              </td>
              <td class="date-cell">{formatDate(usuario.created_at || usuario.data_cadastro)}</td>
              <td>
                <div class="user-actions">
                  {#if userStatus === 'ativo'}
                    <button 
                      class="action-btn suspend-btn"
                      disabled={actionLoading[`status-${usuario.id}`]}
                      on:click={() => updateUserStatus(usuario.id, 'suspenso')}
                      title="Suspender usuário"
                    >
                      {#if actionLoading[`status-${usuario.id}`]}
                        ⏳
                      {:else}
                        ⏸️
                      {/if}
                    </button>
                  {:else if userStatus === 'suspenso'}
                    <button 
                      class="action-btn activate-btn"
                      disabled={actionLoading[`status-${usuario.id}`]}
                      on:click={() => updateUserStatus(usuario.id, 'ativo')}
                      title="Ativar usuário"
                    >
                      {#if actionLoading[`status-${usuario.id}`]}
                        ⏳
                      {:else}
                        ✅
                      {/if}
                    </button>
                  {:else}
                    <button 
                      class="action-btn activate-btn"
                      disabled={actionLoading[`status-${usuario.id}`]}
                      on:click={() => updateUserStatus(usuario.id, 'ativo')}
                      title="Ativar usuário"
                    >
                      {#if actionLoading[`status-${usuario.id}`]}
                        ⏳
                      {:else}
                        ✅
                      {/if}
                    </button>
                  {/if}
                  
                  <button 
                    class="action-btn delete-btn"
                    disabled={actionLoading[`delete-${usuario.id}`]}
                    on:click={() => deleteUser(usuario.id, usuario.email)}
                    title="Excluir usuário"
                  >
                    {#if actionLoading[`delete-${usuario.id}`]}
                      ⏳
                    {:else}
                      🗑️
                    {/if}
                  </button>
                </div>
                
                {#if actionMessages[`status-${usuario.id}`] || actionMessages[`delete-${usuario.id}`]}
                  <div class="action-message">
                    {actionMessages[`status-${usuario.id}`] || actionMessages[`delete-${usuario.id}`]}
                  </div>
                {/if}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="8" class="empty-state">
                <div class="empty-content">
                  <div class="empty-icon">👥</div>
                  <h4>Nenhum usuário encontrado</h4>
                  <p>Ainda não há usuários cadastrados no sistema.</p>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
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
  
  .status-online {
    color: #10b981;
  }
  
  /* Seção de Usuários */
  .users-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    margin-top: var(--spacing-2xl);
  }
  
  .users-table-container {
    background: var(--surface-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-soft);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  
  .users-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .users-table thead {
    background: var(--surface-secondary);
  }
  
  .users-table th {
    padding: var(--spacing-md) var(--spacing-lg);
    text-align: left;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-soft);
  }
  
  .users-table td {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-soft);
    font-size: var(--text-sm);
  }
  
  .users-table tbody tr:hover {
    background: var(--surface-hover);
  }
  
  .user-cell {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .user-avatar-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: white;
    font-size: var(--text-xs);
  }
  
  .user-name {
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .email-cell {
    color: var(--text-secondary);
    font-family: 'Courier New', monospace;
    font-size: var(--text-xs);
  }
  
  .date-cell {
    color: var(--text-secondary);
    font-size: var(--text-xs);
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .user-status-badge {
    padding: 6px 12px;
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  
  .status-ativo {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  
  .status-suspenso {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  
  .status-inativo {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  .expiration-cell {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  
  .days-remaining {
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  
  .expiring-normal {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
  
  .expiring-warning {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }
  
  .expiring-soon {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }
  
  .expiration-warning {
    font-size: 14px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .user-actions {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .activate-btn {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  
  .activate-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    transform: scale(1.05);
  }
  
  .suspend-btn {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  
  .suspend-btn:hover:not(:disabled) {
    background: rgba(245, 158, 11, 0.2);
    transform: scale(1.05);
  }
  
  .delete-btn {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  .delete-btn:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.05);
  }
  
  .action-message {
    margin-top: var(--spacing-xs);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  
  .status-active {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  .status-recent {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  
  .status-inactive {
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
    border: 1px solid rgba(107, 114, 128, 0.2);
  }
  
  .status-never {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-2xl);
  }
  
  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }
  
  .empty-content h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--text-lg);
  }
  
  .empty-content p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }
  
  .actions-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    margin-top: var(--spacing-2xl);
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
    
    .users-table-container {
      overflow-x: auto;
    }
    
    .users-table th,
    .users-table td {
      padding: var(--spacing-sm);
      font-size: var(--text-xs);
    }
    
    .user-cell {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-xs);
    }
  }
  
  @media (max-width: 480px) {
    .users-table th:nth-child(3),
    .users-table td:nth-child(3),
    .users-table th:nth-child(5),
    .users-table td:nth-child(5) {
      display: none;
    }
  }
</style>
