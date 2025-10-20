<script lang="ts">
  import { goto } from '$app/navigation';

  function voltarAoPainel() {
    goto('/painel');
  }
</script>

<section class="retorno">
  <h1>Pagamento aprovado!</h1>
  <p>
    Recebemos a confirmação do Mercado Pago. Seu acesso será liberado em instantes. Se ainda não
    visualizar o conteúdo premium, atualize a página ou entre novamente em alguns segundos.
  </p>
  <button type="button" on:click={voltarAoPainel}>Ir para o painel</button>
</section>

<style>
  .retorno {
    max-width: 560px;
    margin: 0 auto;
    padding: clamp(2.5rem, 6vw, 4rem);
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    align-items: flex-start;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 2.6rem);
  }

  p {
    margin: 0;
    color: rgba(226, 232, 240, 0.75);
    line-height: 1.6;
  }

  button {
    padding: 0.85rem 1.6rem;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #22c55e, #2dd4bf);
    color: #0f172a;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  button:hover {
    transform: translateY(-2px);
    filter: brightness(1.03);
  }
</style>
