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
    max-width: clamp(320px, 90vw, 680px);
    margin: 0 auto;
    padding: clamp(1.5rem, 4vw, 3.5rem);
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2rem);
    min-height: calc(100vh - 4rem);
  }

  header {
    text-align: center;
    padding: clamp(1rem, 2vw, 1.5rem);
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.8);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  header h1 {
    margin: 0 0 clamp(0.5rem, 1vw, 0.75rem) 0;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    font-weight: 800;
    background: linear-gradient(135deg, #fff 0%, rgba(148, 163, 184, 0.9) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: none;
  }

  header p {
    margin: 0;
    color: var(--text-secondary);
    font-size: clamp(0.95rem, 1.8vw, 1.1rem);
    line-height: 1.6;
  }

  .planos {
    display: grid;
    gap: clamp(1rem, 2vw, 1.5rem);
    margin: clamp(1rem, 2vw, 1.5rem) 0;
  }

  label {
    display: block;
    cursor: pointer;
    border-radius: clamp(1rem, 2vw, 1.5rem);
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  label::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.1), transparent);
    transition: left 0.6s ease;
  }

  label:hover::before {
    left: 100%;
  }

  label.selecionado {
    border-color: rgba(249, 115, 22, 0.6);
    transform: translateY(-3px);
    box-shadow: 
      0 20px 40px rgba(249, 115, 22, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  label:hover {
    transform: translateY(-2px);
    border-color: rgba(249, 115, 22, 0.4);
    box-shadow: 0 15px 30px rgba(249, 115, 22, 0.15);
  }

  label input {
    display: none;
  }

  .plano-card {
    padding: clamp(1.5rem, 3vw, 2rem);
    display: flex;
    flex-direction: column;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    position: relative;
    z-index: 1;
  }

  .plano-card strong {
    font-size: clamp(1.1rem, 2.2vw, 1.3rem);
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
  }

  .plano-card strong::before {
    content: '💳';
    font-size: clamp(1.2rem, 2.5vw, 1.5rem);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .plano-card p {
    margin: 0;
    color: var(--text-secondary);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    line-height: 1.6;
  }

  .preco {
    margin-top: clamp(0.75rem, 1.5vw, 1rem);
    font-weight: 800;
    font-size: clamp(1.5rem, 3vw, 2rem);
    color: #f97316;
    display: flex;
    align-items: baseline;
    gap: clamp(0.25rem, 0.5vw, 0.5rem);
    text-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);
  }

  .preco::before {
    content: 'R$';
    font-size: clamp(1rem, 2vw, 1.2rem);
    font-weight: 600;
    color: var(--text-muted);
  }

  .preco::after {
    content: ',90';
    font-size: clamp(1rem, 2vw, 1.2rem);
    font-weight: 600;
  }

  .alerta {
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    display: flex;
    align-items: flex-start;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    backdrop-filter: blur(10px);
    border: 1px solid;
    position: relative;
    overflow: hidden;
  }

  .alerta::before {
    font-size: clamp(1.2rem, 2.5vw, 1.5rem);
    flex-shrink: 0;
  }

  .alerta.erro {
    background: 
      linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(248, 113, 113, 0.15) 100%);
    color: #fecaca;
    border-color: rgba(248, 113, 113, 0.4);
    box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
  }

  .alerta.erro::before {
    content: '⚠️';
  }

  .alerta.sucesso {
    background: 
      linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%);
    color: #bbf7d0;
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2);
  }

  .alerta.sucesso::before {
    content: '✅';
  }

  button {
    align-self: center;
    padding: clamp(1rem, 2vw, 1.25rem) clamp(2rem, 4vw, 3rem);
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: #fff;
    font-weight: 700;
    font-size: clamp(0.95rem, 1.9vw, 1.1rem);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 20px 40px rgba(249, 115, 22, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    min-width: clamp(200px, 40vw, 280px);
  }

  button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
  }

  button:hover:enabled::before {
    left: 100%;
  }

  button:hover:enabled {
    transform: translateY(-3px);
    box-shadow: 
      0 25px 50px rgba(249, 115, 22, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  button:disabled:hover {
    transform: none;
    box-shadow: 
      0 20px 40px rgba(249, 115, 22, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .pagamento-container {
      padding: 1rem 0.75rem;
    }

    .plano-card {
      text-align: center;
    }

    .preco {
      justify-content: center;
    }

    button {
      width: 100%;
      padding: 1.25rem;
    }
  }

  /* Accessibility & Performance */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media (hover: none) {
    label:hover,
    button:hover:enabled {
      transform: none;
    }
  }
</style>
