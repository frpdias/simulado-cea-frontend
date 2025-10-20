<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  const logoUrl =
    'https://zcrzyhdzjanivracmoub.supabase.co/storage/v1/object/public/public-assets/logo5.png';

  export let data: PageData;
  const supabase = data.supabase;

  interface Usuario {
    id: string;
    nome: string;
    email: string;
    whatsapp: string;
    status: string;
    data_cadastro: string;
  }

  let usuarios: Usuario[] = [];
  let loading = true;
  let filtro = '';

  onMount(async () => {
    await carregarUsuarios();
  });

  async function carregarUsuarios() {
    loading = true;
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('data_cadastro', { ascending: false });

      if (error) throw error;
      usuarios = data || [];
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      loading = false;
    }
  }

  async function alterarStatus(id: string, novoStatus: string) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      await carregarUsuarios();
    } catch (err) {
      alert('Erro ao alterar status do usuário');
    }
  }

  async function excluirUsuario(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await carregarUsuarios();
    } catch (err) {
      alert('Erro ao excluir usuário');
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR');
  }

$: usuariosFiltrados = usuarios.filter((usuario) =>
  usuario.nome.toLowerCase().includes(filtro.toLowerCase()) ||
  usuario.email.toLowerCase().includes(filtro.toLowerCase())
);
</script>

<div class="admin">
  <header class="admin__header">
    <div class="admin__brand">
      <img src={logoUrl} alt="FR Educacional" loading="lazy" />
      <span>Simulado CEA · Administração</span>
    </div>
    <div class="admin__intro">
      <h1>Central de usuários</h1>
      <p>Gerencie inscrições, acompanhe status e mantenha a base sempre atualizada.</p>
    </div>
  </header>

  <div class="admin__toolbar">
    <input
      type="text"
      placeholder="Buscar por nome ou e-mail"
      bind:value={filtro}
      aria-label="Buscar usuários"
    />
    <span class="admin__count">
      {loading ? 'Consultando base...' : `${usuariosFiltrados.length} usuário(s)`}
    </span>
  </div>

  {#if loading}
    <div class="admin__state">Carregando usuários...</div>
  {:else if usuariosFiltrados.length === 0}
    <div class="admin__state muted">Nenhum usuário encontrado para o filtro informado.</div>
  {:else}
    <div class="admin__table">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Status</th>
            <th>Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each usuariosFiltrados as usuario (usuario.id)}
            <tr>
              <td>
                <div class="cell-identity">
                  <span class="cell-name">{usuario.nome}</span>
                  <small>{usuario.email}</small>
                </div>
              </td>
              <td class="cell-email">{usuario.email}</td>
              <td>{usuario.whatsapp}</td>
              <td>
                <span class={`badge status ${usuario.status}`}>
                  {usuario.status}
                </span>
              </td>
              <td>{formatarData(usuario.data_cadastro)}</td>
              <td>
                <div class="cell-actions">
                  {#if usuario.status === 'ativo'}
                    <button
                      type="button"
                      class="chip warn"
                      on:click={() => alterarStatus(usuario.id, 'suspenso')}
                    >
                      Suspender
                    </button>
                  {:else}
                    <button
                      type="button"
                      class="chip success"
                      on:click={() => alterarStatus(usuario.id, 'ativo')}
                    >
                      Ativar
                    </button>
                  {/if}
                  <button
                    type="button"
                    class="chip danger"
                    on:click={() => excluirUsuario(usuario.id)}
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .admin {
    max-width: 1180px;
    margin: 0 auto;
    padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem) 4rem;
    display: flex;
    flex-direction: column;
    gap: clamp(1.8rem, 3vw, 2.6rem);
  }

  .admin__header {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: clamp(1rem, 2vw, 1.5rem);
    align-items: center;
  }

  .admin__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    background: rgba(15, 23, 42, 0.78);
    padding: 0.85rem 1.1rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.18);
    max-width: fit-content;
  }

  .admin__brand img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    filter: drop-shadow(0 10px 24px rgba(99, 102, 241, 0.35));
  }

  .admin__brand span {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .admin__intro h1 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.3rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  .admin__intro p {
    margin: 0.75rem 0 0;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .admin__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
    box-shadow: var(--shadow-md);
  }

  .admin__toolbar input {
    flex: 1;
    min-width: 220px;
    padding: 0.9rem 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(15, 23, 42, 0.85);
    color: var(--text-primary);
    font-size: 1rem;
    transition: border 0.18s ease, box-shadow 0.18s ease;
  }

  .admin__toolbar input:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.65);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
  }

  .admin__count {
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .admin__state {
    padding: 2.2rem 1.5rem;
    text-align: center;
    background: rgba(15, 23, 42, 0.75);
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.2);
    color: var(--text-secondary);
    box-shadow: var(--shadow-md);
  }

  .admin__state.muted {
    color: var(--text-muted);
  }

  .admin__table {
    border-radius: var(--radius-lg);
    border: 1px solid rgba(148, 163, 184, 0.25);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    background: rgba(15, 23, 42, 0.85);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    color: var(--text-secondary);
  }

  thead {
    background: rgba(15, 23, 42, 0.92);
  }

  th, td {
    padding: 1rem 1.25rem;
    text-align: left;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  th {
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(226, 232, 240, 0.7);
  }

  tbody tr:nth-child(odd) {
    background: rgba(15, 23, 42, 0.75);
  }

  tbody tr:hover {
    background: rgba(37, 49, 77, 0.85);
  }

  .cell-identity {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .cell-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .cell-identity small,
  .cell-email {
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .badge.status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 96px;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    background: rgba(59, 130, 246, 0.12);
    color: #bfdbfe;
  }

  .badge.status.ativo {
    background: rgba(34, 197, 94, 0.18);
    color: #bbf7d0;
  }

  .badge.status.suspenso {
    background: rgba(250, 204, 21, 0.2);
    color: #fef08a;
  }

  .badge.status.inativo {
    background: rgba(248, 113, 113, 0.18);
    color: #fecaca;
  }

  .cell-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .chip {
    border: none;
    border-radius: 999px;
    padding: 0.45rem 1.05rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
    background: rgba(15, 23, 42, 0.92);
    color: var(--text-secondary);
  }

  .chip:hover {
    transform: translateY(-2px);
  }

  .chip.success {
    background: rgba(34, 197, 94, 0.16);
    color: #bbf7d0;
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.35);
  }

  .chip.warn {
    background: rgba(250, 204, 21, 0.18);
    color: #fef3c7;
    box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.4);
  }

  .chip.danger {
    background: rgba(248, 113, 113, 0.16);
    color: #fecaca;
    box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.4);
  }

  @media (max-width: 820px) {
    .cell-email {
      display: none;
    }
  }
</style>
