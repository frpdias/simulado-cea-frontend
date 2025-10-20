<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import type { PageData } from './$types';

  const logoUrl =
    'https://zcrzyhdzjanivracmoub.supabase.co/storage/v1/object/public/public-assets/logo5.png';

  export let data: PageData;
  const supabase = data.supabase;

  let email = '';
  let senha = '';
  let error = '';
  let loading = false;

  async function realizarLogin() {
    error = '';
    loading = true;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (signInError) {
        throw signInError;
      }

      const currentPage = get(page);
      const redirectTo = currentPage.url.searchParams.get('redirectTo');
      const destino = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/painel';
      await goto(destino, { replaceState: true });
    } catch (err: any) {
      error = err?.message ?? 'Não foi possível entrar. Tente novamente.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth auth--login">
  <aside class="auth__panel">
    <div class="auth__brand">
      <img src={logoUrl} alt="FR Educacional" loading="lazy" />
      <span>Simulado CEA</span>
    </div>

    <h1>Bem-vindo de volta</h1>
    <p>
      Faça login para acompanhar seu desempenho e continuar os simulados personalizados que preparamos para você.
    </p>

    <ul class="auth__highlights">
      <li>Resultados atualizados em tempo real</li>
      <li>Histórico completo de simulados</li>
      <li>Filtros por tema e inteligência de estudos</li>
    </ul>
  </aside>

  <section class="auth__card">
    <header>
      <h2>Entrar na plataforma</h2>
      <p>Acesse com seu e-mail cadastrado para retomar seus estudos.</p>
    </header>

    {#if error}
      <div class="auth__alert">{error}</div>
    {/if}

    <form class="auth__form" on:submit|preventDefault={realizarLogin}>
      <label class="field">
        <span>E-mail profissional</span>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="nome@empresa.com"
          autocomplete="email"
          required
        />
      </label>

      <label class="field">
        <span>Senha</span>
        <input
          id="senha"
          type="password"
          bind:value={senha}
          placeholder="Mínimo 6 caracteres"
          minlength="6"
          autocomplete="current-password"
          required
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Validando dados...' : 'Entrar'}
      </button>
    </form>

    <footer>
      <span>Não tem uma conta?</span>
      <a href="/cadastro">Crie agora mesmo</a>
    </footer>
  </section>
</div>

<style>
  .auth {
    min-height: calc(100vh - 4rem);
    padding: clamp(2.5rem, 5vw, 4rem);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: clamp(2rem, 4vw, 4rem);
    align-items: stretch;
  }

  .auth__panel {
    background: rgba(15, 23, 42, 0.72);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-soft);
    box-shadow: var(--shadow-md);
    padding: clamp(1.8rem, 3vw, 2.6rem);
    display: flex;
    flex-direction: column;
    gap: clamp(1.2rem, 2vw, 1.8rem);
    position: relative;
    overflow: hidden;
  }

  .auth__panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.25), transparent 60%);
    pointer-events: none;
  }

  .auth__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(15, 23, 42, 0.85);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
    max-width: fit-content;
  }

  .auth__brand img {
    width: 48px;
    height: 48px;
    object-fit: contain;
    filter: drop-shadow(0 12px 28px rgba(59, 130, 246, 0.35));
  }

  .auth__brand span {
    font-size: 0.95rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
    font-weight: 600;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 3vw, 2.5rem);
    line-height: 1.25;
    font-weight: 700;
    color: var(--text-primary);
  }

  .auth__panel p {
    margin: 0;
    color: var(--text-muted);
    font-size: clamp(1rem, 1.1vw, 1.1rem);
    line-height: 1.7;
  }

  .auth__highlights {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.65rem;
  }

  .auth__highlights li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.8rem;
    border-radius: var(--radius-sm);
    background: rgba(15, 23, 42, 0.9);
    color: var(--text-secondary);
    font-size: 0.95rem;
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25);
  }

  .auth__highlights li::before {
    content: '✓';
    color: var(--brand-highlight);
    font-weight: 700;
  }

  .auth__card {
    background: rgba(15, 23, 42, 0.68);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-lg);
    padding: clamp(1.9rem, 3vw, 2.5rem);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 440px;
    width: 100%;
    justify-self: center;
  }

  header h2 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  header p {
    margin: 0.5rem 0 0;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .auth__alert {
    background: rgba(220, 38, 38, 0.15);
    border: 1px solid rgba(248, 113, 113, 0.35);
    color: #fecaca;
    padding: 0.85rem 1rem;
    border-radius: var(--radius-sm);
    font-size: 0.95rem;
  }

  .auth__form {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .field span {
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.85rem 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(15, 23, 42, 0.85);
    color: var(--text-primary);
    font-size: 1rem;
    transition: border 0.18s ease, box-shadow 0.18s ease;
  }

  input:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.7);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
  }

  button {
    margin-top: 0.35rem;
    padding: 0.95rem 1rem;
    border-radius: 999px;
    border: none;
    font-weight: 600;
    font-size: 1rem;
    background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    color: #fff;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.2s ease;
    box-shadow: 0 18px 36px rgba(37, 99, 235, 0.25);
  }

  button:hover:enabled {
    transform: translateY(-2px);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  footer a {
    color: var(--text-secondary);
    font-weight: 600;
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }

  @media (max-width: 860px) {
    .auth {
      grid-template-columns: 1fr;
    }

    .auth__panel {
      order: 2;
    }

    .auth__card {
      order: 1;
      max-width: 100%;
    }
  }
</style>
