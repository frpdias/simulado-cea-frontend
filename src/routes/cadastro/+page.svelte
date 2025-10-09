<script lang="ts">
  import { goto } from '$app/navigation';

  let nome = '';
  let email = '';
  let whatsapp = '';
  let senha = '';
  let confirmarSenha = '';
  let loading = false;
  let error = '';

  async function cadastrar() {
    error = '';
    
    if (senha !== confirmarSenha) {
      error = 'As senhas não coincidem';
      return;
    }

    loading = true;

    try {
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome,
          email,
          whatsapp,
          senha
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      alert('Cadastro realizado com sucesso!');
      goto('/login');
    } catch (err: any) {
      error = err.message || 'Erro ao criar conta';
    } finally {
      loading = false;
    }
  }
</script>

<div class="center">
  <div class="card">
    <h2>Criar Conta</h2>
    
    {#if error}
      <div class="error">{error}</div>
    {/if}

    <form on:submit|preventDefault={cadastrar}>
      <label for="nome">Nome Completo</label>
      <input 
        type="text" 
        id="nome" 
        bind:value={nome} 
        required 
        placeholder="Seu nome completo"
      />

      <label for="email">E-mail</label>
      <input 
        type="email" 
        id="email" 
        bind:value={email} 
        required 
        placeholder="seu@email.com"
      />

      <label for="whatsapp">WhatsApp</label>
      <input 
        type="tel" 
        id="whatsapp" 
        bind:value={whatsapp} 
        required 
        placeholder="(11) 99999-9999"
      />

      <label for="senha">Senha</label>
      <input 
        type="password" 
        id="senha" 
        bind:value={senha} 
        required 
        placeholder="Mínimo 6 caracteres"
        minlength="6"
      />

      <label for="confirmarSenha">Confirmar Senha</label>
      <input 
        type="password" 
        id="confirmarSenha" 
        bind:value={confirmarSenha} 
        required 
        placeholder="Digite a senha novamente"
        minlength="6"
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>

    <p style="text-align: center; margin-top: 1rem;">
      Já tem uma conta? <a href="/login">Faça login</a>
    </p>
  </div>
</div>

<style>
  .error {
    background: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px solid #fcc;
  }
  
  a {
    color: #3b82f6;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
