<script lang="ts">
  import { goto } from '$app/navigation';

  function tentarNovamente() {
    goto('/pagamento');
  }
</script>

<section class="retorno erro">
  <h1>Pagamento não concluído</h1>
  <p>
    O Mercado Pago informou que a transação não foi aprovada. Verifique os dados do cartão ou escolha
    outro meio de pagamento e tente novamente.
  </p>
  <button type="button" on:click={tentarNovamente}>Voltar para pagamento</button>
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
    color: rgba(248, 113, 113, 0.8);
    line-height: 1.6;
  }

  button {
    padding: 0.85rem 1.6rem;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #f97316, #f43f5e);
    color: #fff7ed;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  button:hover {
    transform: translateY(-2px);
    filter: brightness(1.05);
  }
</style>
