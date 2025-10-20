<script lang="ts">
  import { onMount } from 'svelte';

  const planos = [
    {
      id: 'pix-29',
      titulo: 'Pagamento via PIX',
      descricao: 'Libere o acesso ao painel premium com um único pagamento.',
      preco: 29.9
    }
  ];

  let carregando = false;
  let erro = '';
  let mensagem = '';
  let planoSelecionado = planos[0].id;

  onMount(() => {
    mensagem = '';
    erro = '';
  });

  async function iniciarPagamento() {
    erro = '';
    mensagem = '';
    const plano = planos.find((item) => item.id === planoSelecionado);
    if (!plano) {
      erro = 'Selecione um plano válido.';
      return;
    }

    try {
      carregando = true;
      const resposta = await fetch('/api/pagamentos/preferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plano.titulo,
          price: plano.preco,
          quantity: 1
        })
      });

      if (!resposta.ok) {
        const { error: errorMsg } = await resposta.json().catch(() => ({ error: 'Erro desconhecido.' }));
        throw new Error(errorMsg ?? 'Não foi possível iniciar o pagamento.');
      }

      const dados = await resposta.json();

      if (dados?.init_point) {
        mensagem = 'Redirecionando para o Mercado Pago...';
        window.location.href = dados.init_point;
        return;
      }

      erro = 'Resposta inesperada do servidor.';
    } catch (err: any) {
      erro = err?.message ?? 'Falha ao iniciar o pagamento.';
    } finally {
      carregando = false;
    }
  }
</script>

<div class="pagamento-container">
  <header>
    <h1>Confirme o pagamento via PIX</h1>
    <p>Geramos uma cobrança no Mercado Pago com valor fixo de R$ 29,90.</p>
  </header>

  <section class="planos">
    {#each planos as plano}
      <label class:selecionado={planoSelecionado === plano.id}>
        <input type="radio" name="plano" value={plano.id} bind:group={planoSelecionado} />
        <div class="plano-card">
          <strong>{plano.titulo}</strong>
          <p>{plano.descricao}</p>
          <span class="preco">R$ {plano.preco.toFixed(2)}</span>
        </div>
      </label>
    {/each}
  </section>

  {#if erro}
    <div class="alerta erro">{erro}</div>
  {/if}

  {#if mensagem}
    <div class="alerta sucesso">{mensagem}</div>
  {/if}

  <button type="button" on:click={iniciarPagamento} disabled={carregando}>
    {carregando ? 'Gerando cobrança...' : 'Gerar QR Code PIX'}
  </button>
</div>

<style>
  .pagamento-container {
    max-width: 640px;
    margin: 0 auto;
    padding: clamp(2rem, 5vw, 3.5rem);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  header h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 2.4rem);
  }

  header p {
    margin: 0;
    color: rgba(226, 232, 240, 0.7);
  }

  .planos {
    display: grid;
    gap: 1rem;
  }

  label {
    display: block;
    cursor: pointer;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    background: rgba(15, 23, 42, 0.8);
    transition: border 0.2s ease, transform 0.2s ease;
  }

  label.selecionado {
    border-color: rgba(99, 102, 241, 0.6);
    transform: translateY(-2px);
  }

  label input {
    display: none;
  }

  .plano-card {
    padding: 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .plano-card strong {
    font-size: 1.1rem;
  }

  .plano-card p {
    margin: 0;
    color: rgba(226, 232, 240, 0.7);
  }

  .preco {
    margin-top: 0.5rem;
    font-weight: 700;
    color: #38bdf8;
  }

  .alerta {
    border-radius: 12px;
    padding: 0.9rem 1rem;
    font-size: 0.95rem;
  }

  .alerta.erro {
    background: rgba(248, 113, 113, 0.12);
    color: #fecaca;
    border: 1px solid rgba(248, 113, 113, 0.3);
  }

  .alerta.sucesso {
    background: rgba(16, 185, 129, 0.12);
    color: #bbf7d0;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  button {
    align-self: flex-start;
    padding: 0.85rem 1.6rem;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.05);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
