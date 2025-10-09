<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

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

  $: usuariosFiltrados = usuarios.filter(usuario => 
    usuario.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.email.toLowerCase().includes(filtro.toLowerCase())
  );
</script>

<div class="container">
  <h1>Painel do Administrador</h1>

  <div class="filtros">
    <input
      type="text"
      placeholder="Buscar usuário..."
      bind:value={filtro}
    />
  </div>

  {#if loading}
    <div class="loading">Carregando usuários...</div>
  {:else if usuariosFiltrados.length === 0}
    <div class="empty">Nenhum usuário encontrado</div>
  {:else}
    <div class="tabela">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Status</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each usuariosFiltrados as usuario (usuario.id)}
            <tr>
              <td>{usuario.nome}</td>
              <td>{usuario.email}</td>
              <td>{usuario.whatsapp}</td>
              <td class="status-{usuario.status}">{usuario.status}</td>
              <td>{formatarData(usuario.data_cadastro)}</td>
              <td>
                <div class="acoes">
                  {#if usuario.status === 'ativo'}
                    <button
                      class="btn warn"
                      on:click={() => alterarStatus(usuario.id, 'suspenso')}
                    >
                      Suspender
                    </button>
                  {:else}
                    <button
                      class="btn success"
                      on:click={() => alterarStatus(usuario.id, 'ativo')}
                    >
                      Ativar
                    </button>
                  {/if}
                  
                  <button
                    class="btn danger"
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
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }

  .filtros {
    margin-bottom: 2rem;
  }

  input {
    width: 100%;
    max-width: 400px;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }

  .loading, .empty {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .tabela {
    overflow-x: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
  }

  .status-ativo { color: #28a745; }
  .status-suspenso { color: #ffc107; }
  .status-inativo { color: #dc3545; }

  .acoes {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn:hover { opacity: 0.8; }

  .btn.success { background: #28a745; color: white; }
  .btn.warn { background: #ffc107; color: black; }
  .btn.danger { background: #dc3545; color: white; }
</style>
