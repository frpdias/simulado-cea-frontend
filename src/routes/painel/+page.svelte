<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import RadarChart from '$lib/RadarChart.svelte';
  import type { PageData } from './$types';

  interface Usuario {
    id: string;
    nome: string;
    email: string;
    whatsapp?: string;
    status?: string;
    data_cadastro?: string;
  }

  const logoFrUrl =
    'https://zcrzyhdzjanivracmoub.supabase.co/storage/v1/object/public/public-assets/logo5.png';

  export let data: PageData;
  const supabase = data.supabase;

  function obterIniciais(nome: string) {
    if (!nome) return 'AL';
    const partes = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!partes.length) return 'AL';
    return partes.map((parte) => (parte[0] ? parte[0].toUpperCase() : '')).join('') || 'AL';
  }

  let carregando = true;
  let usuarioAuth: Usuario | null = null;
  let perfil: Usuario | null = null;
  let erro = '';
  let erroSimulados = '';
  let carregandoSimulados = true;

  interface SimuladoResumo {
    numero: number;
    totalQuestoes: number;
    temas: string[];
  }

  interface TemaResumo {
    tema: string;
    totalQuestoes: number;
  }

  interface SimuladoCard {
    numero: number;
    totalQuestoes: number;
    disponivel: boolean;
  }

  interface TemaCard {
    tema: string;
    totalQuestoes: number;
    disponivel: boolean;
  }

  const TOTAL_SIMULADOS = 6;
  const TOTAL_TEMAS = 6;
  const RING_RADIUS = 66;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  let simuladosResumo: SimuladoResumo[] = [];
  let temasResumo: TemaResumo[] = [];
  let temaParaSimulado = new Map<string, number>();
  let carregandoDesempenho = true;
  let erroDesempenho = '';
  let aproveitamentoGeral: number | null = null;
  let desempenhoTotalQuestoes = 0;
  let desempenhoTotalAcertos = 0;
  let aproveitamentoTemas: { tema: string; percentual: number; acertos: number; total: number }[] =
    [];
  let simuladosCards: SimuladoCard[] = [];
  let temasCards: TemaCard[] = [];
  $: radarLabels = aproveitamentoTemas.map((tema) => tema.tema);
  $: radarData = aproveitamentoTemas.map((tema) => tema.percentual);
  $: simuladosCards = Array.from({ length: TOTAL_SIMULADOS }, (_, index) => {
    const numero = index + 1;
    const info = simuladosResumo.find((sim) => sim.numero === numero);
    return {
      numero,
      totalQuestoes: info?.totalQuestoes ?? 0,
      disponivel: Boolean(info)
    };
  });
  $: temasCards = (() => {
    const existentes = temasResumo.slice(0, TOTAL_TEMAS).map((tema) => ({
      tema: tema.tema,
      totalQuestoes: tema.totalQuestoes,
      disponivel: temaParaSimulado.has(tema.tema)
    }));

    const placeholders: TemaCard[] = [];
    for (let i = existentes.length; i < TOTAL_TEMAS; i += 1) {
      placeholders.push({
        tema: 'Tema em breve',
        totalQuestoes: 0,
        disponivel: false
      });
    }
    return [...existentes, ...placeholders];
  })();

  onMount(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      goto('/login');
      return;
    }

    usuarioAuth = {
      id: session.user.id,
      nome: session.user.user_metadata?.nome ?? session.user.email ?? '',
      email: session.user.email ?? '',
      whatsapp: session.user.user_metadata?.whatsapp
    };

    const { data: dadosPerfil, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      erro = error.message;
    } else if (dadosPerfil) {
      perfil = dadosPerfil;
    }

    await carregarSimulados();
    await carregarDesempenho(session.user.id);

    carregando = false;
  });

  async function carregarSimulados() {
    carregandoSimulados = true;
    erroSimulados = '';
    temaParaSimulado = new Map();

    const { data, error } = await supabase
      .from('questoes')
      .select('simulado_numero, tema')
      .order('simulado_numero', { ascending: true });

    if (error) {
      erroSimulados = error.message;
      simuladosResumo = [];
      temasResumo = [];
      carregandoSimulados = false;
      return;
    }

    const porNumero = new Map<number, { total: number; temas: Set<string> }>();
    const porTema = new Map<string, number>();

    for (const questao of data ?? []) {
      const numero = questao.simulado_numero;
      const tema = questao.tema?.trim();

      if (typeof numero === 'number') {
        if (!porNumero.has(numero)) {
          porNumero.set(numero, { total: 0, temas: new Set<string>() });
        }
        const stats = porNumero.get(numero)!;
        stats.total += 1;
        if (tema) stats.temas.add(tema);
        if (tema && !temaParaSimulado.has(tema)) {
          temaParaSimulado.set(tema, numero);
        }
      }

      if (tema) {
        porTema.set(tema, (porTema.get(tema) ?? 0) + 1);
      }
    }

    simuladosResumo = Array.from(porNumero.entries())
      .map(([numero, stats]) => ({
        numero,
        totalQuestoes: stats.total,
        temas: Array.from(stats.temas).sort()
      }))
      .sort((a, b) => a.numero - b.numero);

    temasResumo = Array.from(porTema.entries())
      .map(([tema, totalQuestoes]) => ({ tema, totalQuestoes }))
      .sort((a, b) => b.totalQuestoes - a.totalQuestoes);

    carregandoSimulados = false;
  }

  async function carregarDesempenho(userId: string) {
    carregandoDesempenho = true;
    erroDesempenho = '';
    aproveitamentoGeral = null;
    desempenhoTotalAcertos = 0;
    desempenhoTotalQuestoes = 0;
    aproveitamentoTemas = [];

    const { data: respostasData, error: respostasError } = await supabase
      .from('simulados_respostas')
      .select('id, simulado_numero, acertos, total_questoes, tempo_gasto_segundos, respostas')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (respostasError) {
      erroDesempenho = respostasError.message;
      carregandoDesempenho = false;
      return;
    }

    const resultados = respostasData ?? [];

    if (resultados.length === 0) {
      carregandoDesempenho = false;
      return;
    }

    const idsQuestoes = new Set<number>();

    for (const resultado of resultados) {
      const total = Number(resultado.total_questoes) || 0;
      const acertos = Number(resultado.acertos) || 0;
      desempenhoTotalQuestoes += total;
      desempenhoTotalAcertos += acertos;

      const respostas = resultado.respostas ?? {};
      if (respostas && typeof respostas === 'object') {
        for (const chave of Object.keys(respostas)) {
          const id = Number(chave);
          if (!Number.isNaN(id)) idsQuestoes.add(id);
        }
      }
    }

    const questoesMapa = new Map<number, { tema: string; resposta_correta: string | null }>();

    if (idsQuestoes.size > 0) {
      const { data: questoesData, error: questoesError } = await supabase
        .from('questoes')
        .select('id, tema, resposta_correta')
        .in('id', Array.from(idsQuestoes));

      if (questoesError) {
        erroDesempenho = questoesError.message;
        carregandoDesempenho = false;
        return;
      }

      for (const questao of questoesData ?? []) {
        questoesMapa.set(questao.id, {
          tema: questao.tema?.trim() || 'Geral',
          resposta_correta: questao.resposta_correta ?? null
        });
      }
    }

    const temasMapa = new Map<string, { acertos: number; total: number }>();

    for (const resultado of resultados) {
      const respostas = resultado.respostas ?? {};
      if (!respostas || typeof respostas !== 'object') continue;

      for (const [chave, respostaMarcada] of Object.entries(respostas)) {
        const id = Number(chave);
        if (Number.isNaN(id)) continue;
        const questao = questoesMapa.get(id);
        if (!questao) continue;

        const tema = questao.tema || 'Geral';
        if (!temasMapa.has(tema)) {
          temasMapa.set(tema, { acertos: 0, total: 0 });
        }

        const registro = temasMapa.get(tema)!;
        registro.total += 1;

        if (
          typeof respostaMarcada === 'string' &&
          questao.resposta_correta &&
          respostaMarcada.trim().toUpperCase() === questao.resposta_correta.trim().toUpperCase()
        ) {
          registro.acertos += 1;
        }
      }
    }

    aproveitamentoGeral =
      desempenhoTotalQuestoes > 0
        ? Math.round((desempenhoTotalAcertos / desempenhoTotalQuestoes) * 100)
        : null;

    aproveitamentoTemas = Array.from(temasMapa.entries())
      .map(([tema, valores]) => ({
        tema,
        acertos: valores.acertos,
        total: valores.total,
        percentual: valores.total > 0 ? Math.round((valores.acertos / valores.total) * 100) : 0
      }))
      .sort((a, b) => b.percentual - a.percentual);

    carregandoDesempenho = false;
  }

  $: totalSimulados = simuladosResumo.length;
  $: totalQuestoes = simuladosResumo.reduce((acc, sim) => acc + sim.totalQuestoes, 0);
  $: totalTemas = (() => {
    const temas = new Set<string>();
    for (const sim of simuladosResumo) {
      for (const tema of sim.temas) {
        temas.add(tema);
      }
    }
    return temas.size;
  })();

  $: nomePrincipal = perfil?.nome ?? usuarioAuth?.nome ?? '';
  $: emailPrincipal = perfil?.email ?? usuarioAuth?.email ?? '';
  $: iniciaisAvatar = obterIniciais(nomePrincipal || emailPrincipal);
  $: statusBruto = (perfil?.status ?? '').trim();
  $: statusTexto = statusBruto || 'Ativo';
  $: statusClass = statusTexto.toLowerCase().replace(/\s+/g, '-');

  function iniciarSimulado(numero: number) {
    goto(`/simulados/${numero}`);
  }

  function iniciarPorTema(tema: string) {
    const temaNormalizado = tema.trim();
    const numero = temaParaSimulado.get(temaNormalizado);
    if (numero) {
      const temaQuery = encodeURIComponent(temaNormalizado);
      goto(`/simulados/${numero}?tema=${temaQuery}`);
    }
  }

  $:
    ringOffset =
      aproveitamentoGeral !== null
        ? RING_CIRCUMFERENCE - (aproveitamentoGeral / 100) * RING_CIRCUMFERENCE
        : RING_CIRCUMFERENCE;

  $: mediaAcertos = simuladosResumo.length
    ? Math.round(desempenhoTotalAcertos / simuladosResumo.length)
    : 0;

  $: mediaQuestoes = simuladosResumo.length
    ? Math.round(desempenhoTotalQuestoes / simuladosResumo.length)
    : 0;

  $: taxaErro = aproveitamentoGeral !== null ? Math.max(0, 100 - aproveitamentoGeral) : 0;

  $: melhorTema = aproveitamentoTemas.length ? aproveitamentoTemas[0] : null;

  $: temaReforcar = aproveitamentoTemas.length
    ? aproveitamentoTemas[aproveitamentoTemas.length - 1]
    : null;

  async function sair() {
    await supabase.auth.signOut();
    goto('/login');
  }

  function fitText(node: HTMLElement, options: { minSize?: number; maxSize?: number; step?: number } = {}) {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const parent = node.parentElement;
    if (!parent) return;

    const { minSize = 0.8, maxSize = 1.2, step = 0.02 } = options;

    const adjust = () => {
      let size = maxSize;
      node.style.fontSize = `${size}rem`;

      const available = parent.clientHeight - 4;

      while (size > minSize && node.scrollHeight > available) {
        size -= step;
        node.style.fontSize = `${size.toFixed(2)}rem`;
      }
    };

    const observer = new ResizeObserver(() => adjust());
    observer.observe(parent);
    observer.observe(node);

    const raf = requestAnimationFrame(adjust);

    return {
      destroy() {
        cancelAnimationFrame(raf);
        observer.disconnect();
      }
    };
  }
</script>

<svelte:head>
  <title>Painel do Aluno | Simulado CEA</title>
</svelte:head>

<div class="container">
  <header class="topo">
    <section class="hero-card">
      <div class="hero-overlay overlay-a"></div>
      <div class="hero-overlay overlay-b"></div>

      <div class="hero-header">
        <div class="hero-user">
          <div class="hero-avatar">{iniciaisAvatar}</div>
          <div class="hero-user-text">
            <strong>{nomePrincipal || 'Aluno CEA'}</strong>
            {#if emailPrincipal}
              <small>{emailPrincipal}</small>
            {/if}
            <span class="hero-sub brand">FR Educacional</span>
            <span class="hero-sub produto">Simulado CEA</span>
          </div>
        </div>

        <div class="hero-actions">
          <div class="hero-brand">
            <img src={logoFrUrl} alt="FR Educacional" loading="lazy" />
            <span>Simulado CEA</span>
          </div>
          <button class="hero-action botao-sair" on:click={sair}>Sair</button>
          <span class={`hero-action status-pill ${statusClass}`}>Status: {statusTexto}</span>
        </div>
      </div>

    </section>
  </header>

  <main>
    <section class="card desempenho">
      <div class="desempenho-header">
        <h2>Seu aproveitamento</h2>
        {#if carregandoDesempenho}
          <span class="badge neutro">Carregando...</span>
        {:else if erroDesempenho}
          <span class="badge erro">{erroDesempenho}</span>
        {/if}
      </div>

      {#if carregandoDesempenho}
        <div class="desempenho-skeleton">
          <div class="skeleton redondo"></div>
          <div class="skeleton barra"></div>
        </div>
      {:else if erroDesempenho}
        <p class="erro">{erroDesempenho}</p>
      {:else if aproveitamentoGeral === null}
        <p class="vazio">
          Nenhum resultado registrado ainda. Finalize um simulado para visualizar seu desempenho.
        </p>
      {:else}
        <div class="desempenho-grid">
          <section class="aproveitamento-hero">
            <header class="aproveitamento-head">
              <span class="aproveitamento-kicker">Painel de progresso</span>
              <h3>{nomePrincipal ? `${nomePrincipal.split(' ')[0]}, continue acelerando!` : 'Seu progresso atualizado'}</h3>
              <p>Consolidado com base nos simulados finalizados recentemente.</p>
            </header>

            <div class="aproveitamento-ring" role="img" aria-label={`Aproveitamento de ${aproveitamentoGeral}%`}>
              <svg viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#6366f1" />
                  </linearGradient>
                  <linearGradient id="ring-gradient-positive" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#34d399" />
                    <stop offset="100%" stop-color="#14b8a6" />
                  </linearGradient>
                </defs>
                <circle class="ring-track" cx="100" cy="100" r="74" />
                <circle
                  class={`ring-progress ${aproveitamentoGeral !== null && aproveitamentoGeral >= 70 ? 'positivo' : ''}`}
                  cx="100"
                  cy="100"
                  r="74"
                  stroke-dasharray={2 * Math.PI * 74}
                  stroke-dashoffset={
                    aproveitamentoGeral !== null
                      ? 2 * Math.PI * 74 - (aproveitamentoGeral / 100) * 2 * Math.PI * 74
                      : 2 * Math.PI * 74
                  }
                />
              </svg>
              <div class="ring-value">
                <strong>{aproveitamentoGeral}%</strong>
                <span>Aproveitamento</span>
                <small>{simuladosResumo.length} simulado(s) concluído(s)</small>
              </div>
            </div>

            <div class="aproveitamento-stats">
              <div class="aproveitamento-stat">
                <span>Acertos</span>
                <strong>{desempenhoTotalAcertos}</strong>
                <small>Média {mediaAcertos} por simulado</small>
              </div>
              <div class="aproveitamento-stat">
                <span>Questões</span>
                <strong>{desempenhoTotalQuestoes}</strong>
                <small>Média {mediaQuestoes} por simulado</small>
              </div>
              <div class="aproveitamento-stat alerta">
                <span>Taxa de erro</span>
                <strong>{taxaErro}%</strong>
                <small>{desempenhoTotalQuestoes - desempenhoTotalAcertos} respostas incorretas</small>
              </div>
            </div>

            <div class="aproveitamento-actions">
              <button type="button" on:click={() => goto('/simulados')}>
                Iniciar novo simulado
              </button>
              <button type="button" class="ghost" on:click={() => goto('/painel?historico=1')}>
                Visualizar histórico completo
              </button>
            </div>
          </section>

          <aside class="aproveitamento-side">
            <div class="side-card summary">
              <h4>Resumo rápido</h4>
              <div class="timeline-item">
                <span class="indicador ganho"></span>
                <div class="timeline-copy">
                  <strong>{desempenhoTotalAcertos}</strong>
                  <small>acertos distribuídos em {simuladosResumo.length} simulado(s)</small>
                </div>
              </div>
              <div class="timeline-item">
                <span class="indicador neutro"></span>
                <div class="timeline-copy">
                  <strong>{desempenhoTotalQuestoes}</strong>
                  <small>questões praticadas ao longo da jornada</small>
                </div>
              </div>
              <div class="timeline-item">
                <span class="indicador alerta"></span>
                <div class="timeline-copy">
                  <strong>{desempenhoTotalQuestoes - desempenhoTotalAcertos}</strong>
                  <small>oportunidades para revisar conteúdos chave</small>
                </div>
              </div>
            </div>

            {#if melhorTema}
              <div class="side-card destaque positivo">
                <div class="side-card-head">
                  <span>Maior desempenho</span>
                  <strong>{melhorTema.tema}</strong>
                </div>
                <div class="progress">
                  <span style={`width: ${melhorTema.percentual}%`}></span>
                </div>
                <small>{melhorTema.percentual}% de acerto</small>
              </div>
            {/if}

            {#if temaReforcar && temaReforcar !== melhorTema}
              <div class="side-card destaque alerta">
                <div class="side-card-head">
                  <span>Foco para revisão</span>
                  <strong>{temaReforcar.tema}</strong>
                </div>
                <div class="progress">
                  <span style={`width: ${temaReforcar.percentual}%`}></span>
                </div>
                <small>{temaReforcar.percentual}% de acerto</small>
              </div>
            {/if}
          </aside>
        </div>
      {/if}
    </section>

    <div class="simulados-paineis">
      <section class="card simulados">
        <div class="cabecalho seção">
          <h2>Simulados por número</h2>
          {#if carregandoSimulados}
            <span class="badge neutro">Carregando...</span>
          {:else if erroSimulados}
            <span class="badge erro">{erroSimulados}</span>
          {/if}
        </div>

        {#if carregandoSimulados}
          <div class="skeleton-grid">
            {#each Array(3) as _, index}
              <div class="skeleton" aria-hidden="true"></div>
            {/each}
          </div>
        {:else if erroSimulados}
          <p class="erro">{erroSimulados}</p>
        {:else}
          <div class="simulados-grid">
          {#each simuladosCards as simulado}
            <button
              type="button"
              class="simulado-box"
              class:indisponivel={!simulado.disponivel}
                on:click={() => simulado.disponivel && iniciarSimulado(simulado.numero)}
                disabled={!simulado.disponivel}
            >
              <div class="simulado-content">
                <strong class="simulado-title">{simulado.numero}</strong>
                {#if !simulado.disponivel}
                  <span class="simulado-foot indisponivel">Em breve</span>
                {/if}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card simulados temas-card">
        <div class="cabecalho seção">
          <h2>Filtrar por tema</h2>
          {#if carregandoSimulados}
            <span class="badge neutro">Carregando...</span>
          {:else if erroSimulados}
            <span class="badge erro">{erroSimulados}</span>
          {/if}
        </div>

        {#if carregandoSimulados}
          <div class="skeleton-grid temas">
            {#each Array(6) as _, index}
              <div class="skeleton" aria-hidden="true"></div>
            {/each}
          </div>
        {:else if erroSimulados}
          <p class="erro">{erroSimulados}</p>
        {:else if !temasCards.length}
          <p class="vazio">Cadastre temas para habilitar os filtros por assunto.</p>
        {:else}
          <div class="temas-grid">
            {#each temasCards as tema}
              <button
                type="button"
                class="simulado-box tema"
                class:indisponivel={!tema.disponivel}
                on:click={() => tema.disponivel && iniciarPorTema(tema.tema)}
                disabled={!tema.disponivel}
              >
                <div class="simulado-content">
                  <strong class="simulado-title tema-titulo" use:fitText={{ minSize: 0.75, maxSize: 1.15 }}>{tema.tema}</strong>
                  {#if !tema.disponivel}
                    <span class="simulado-foot indisponivel">Em breve</span>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  </main>
</div>

<style>
  /* Responsividade para telas menores */
  @media (max-width: 900px) {
    .desempenho-grid {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }
    .aproveitamento-hero {
      padding: 1.2rem 0.7rem;
    }
    .aproveitamento-ring {
      width: 140px;
      height: 140px;
    }
    .aproveitamento-ring svg {
      width: 140px;
      height: 140px;
    }
    .aproveitamento-head h3 {
      font-size: 1.2rem;
    }
    .aproveitamento-stat strong {
      font-size: 1.1rem;
    }
    .side-card {
      padding: 0.8rem 0.7rem;
    }
  }

  @media (max-width: 600px) {
    main {
      padding: 0.5rem;
      gap: 0.7rem;
    }
    .desempenho-grid {
      grid-template-columns: 1fr;
      gap: 0.7rem;
    }
    .aproveitamento-hero {
      padding: 0.7rem 0.2rem;
      border-radius: 18px;
    }
    .aproveitamento-ring {
      width: 90px;
      height: 90px;
    }
    .aproveitamento-ring svg {
      width: 90px;
      height: 90px;
    }
    .aproveitamento-head h3 {
      font-size: 1rem;
    }
    .aproveitamento-stat strong {
      font-size: 0.95rem;
    }
    .aproveitamento-stats {
      gap: 0.5rem;
    }
    .side-card {
      padding: 0.5rem 0.4rem;
      border-radius: 12px;
    }
    .side-title {
      font-size: 0.95rem;
    }
    .simulados-paineis {
      grid-template-columns: 1fr;
      gap: 0.7rem;
    }
    .simulados-grid {
      grid-template-columns: 1fr;
      gap: 0.7rem;
    }
    .simulado-content {
      max-width: 100%;
      padding: 0.7rem 0.5rem;
    }
    .simulado-title {
      font-size: 1.1rem;
    }
    .simulado-foot {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
    }
  }
  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem clamp(1.2rem, 4vw, 2.4rem) 4rem;
  }

  .topo {
    margin-bottom: 2.5rem;
  }

  .hero-card {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-lg);
    padding: clamp(2rem, 3vw, 2.75rem);
    background: linear-gradient(135deg, rgba(29, 78, 216, 0.92) 0%, rgba(42, 67, 171, 0.88) 40%, rgba(15, 118, 110, 0.78) 100%);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: var(--shadow-lg);
    color: var(--text-primary);
  }

  .hero-overlay {
    position: absolute;
    z-index: 0;
    border-radius: 50%;
    opacity: 0.35;
    pointer-events: none;
    filter: blur(0);
  }

  .overlay-a {
    width: 340px;
    height: 340px;
    top: -160px;
    right: -90px;
    background: radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.6), transparent 65%);
  }

  .overlay-b {
    width: 240px;
    height: 240px;
    bottom: -110px;
    left: -80px;
    background: radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.45), transparent 70%);
  }

  .hero-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.75rem;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }

  .hero-user {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex: 1 1 200px;
    min-width: 200px;
  }

  .hero-avatar {
    width: 60px;
    height: 60px;
    border-radius: 20px;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .hero-user-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    text-align: left;
  }

  .hero-user-text strong {
    font-size: 1.25rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .hero-user-text small {
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .hero-sub {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.6rem;
    min-width: 220px;
  }

  .hero-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.85rem;
    background: rgba(15, 23, 42, 0.85);
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.28);
  }

  .hero-brand img {
    width: 34px;
    height: 34px;
    object-fit: contain;
  }

  .hero-brand span {
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    color: var(--text-primary);
    text-transform: uppercase;
  }

  .hero-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.55rem 1.4rem;
    border: none;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    box-shadow: 0 14px 32px rgba(37, 99, 235, 0.25);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .hero-action:hover {
    transform: translateY(-2px);
  }

  .status-pill {
    cursor: default;
    padding: 0.45rem 1.2rem;
    border-radius: 999px;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: rgba(34, 197, 94, 0.18);
    color: #bbf7d0;
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.35);
  }

  .status-pill:not(.ativo) {
    background: rgba(248, 113, 113, 0.2);
    color: #fecaca;
    box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.35);
  }

  main {
    display: flex;
    flex-direction: column;
    gap: 1.65rem;
  }

  .card {
    background: rgba(15, 23, 42, 0.85);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: var(--shadow-md);
    padding: clamp(2rem, 3vw, 2.6rem);
    color: var(--text-secondary);
  }

  .card.desempenho {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .desempenho-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .desempenho-grid {
    display: grid;
    grid-template-columns: minmax(360px, 420px) minmax(320px, 1fr);
    gap: clamp(1.8rem, 3vw, 2.5rem);
    align-items: stretch;
  }

  .desempenho-skeleton {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .desempenho-skeleton .skeleton.redondo {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }

  .desempenho-skeleton .skeleton.barra {
    flex: 1;
    height: 20px;
    border-radius: 999px;
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }

  .desempenho-overview {
    background: rgba(15, 23, 42, 0.92);
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: var(--shadow-md);
    padding: clamp(1.8rem, 3vw, 2.4rem);
    display: grid;
    grid-template-columns: minmax(220px, 240px) minmax(220px, 1fr);
    gap: clamp(1.4rem, 2vw, 2rem);
    align-items: center;
  }

  .overview-ring {
    position: relative;
    width: 180px;
    height: 180px;
    margin: 0 auto;
  }

  .ring-track {
    fill: none;
    stroke: rgba(15, 23, 42, 0.75);
    stroke-width: 14;
  }

  .ring-progress {
    fill: none;
    stroke: url(#ring-gradient);
    stroke-linecap: round;
    stroke-width: 14;
    transition: stroke-dashoffset 0.4s ease;
  }

  .ring-progress.positivo {
    stroke: url(#ring-gradient-positive);
  }

  .ring-value {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    color: var(--text-primary);
  }

  .ring-value strong {
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1;
  }

  .ring-value span {
    font-size: 0.9rem;
    color: var(--text-muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .desempenho-side {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    background: rgba(15, 23, 42, 0.92);
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: var(--shadow-md);
    padding: clamp(1.4rem, 2.6vw, 1.9rem);
  }

  .side-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }

  .desempenho-timeline {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .timeline-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem 0.9rem;
    border-radius: var(--radius-sm);
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.25);
    color: var(--text-secondary);
  }

  .indicador {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .indicador.ganho { background: #22c55e; }
  .indicador.neutro { background: #38bdf8; }
  .indicador.alerta { background: #f97316; }

  .timeline-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .timeline-copy strong {
    font-size: 1.15rem;
    color: var(--text-primary);
    font-weight: 600;
    line-height: 1;
  }

  .timeline-copy small {
    font-size: 0.9rem;
    color: rgba(148, 163, 184, 0.7);
  }

  /* Novo layout de aproveitamento */
  .desempenho-grid {
    display: grid;
    grid-template-columns: minmax(380px, 520px) minmax(300px, 1fr);
    gap: clamp(1.8rem, 4vw, 3rem);
    align-items: stretch;
  }

  .aproveitamento-hero {
    background: radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.25), transparent 55%),
      radial-gradient(circle at 90% 10%, rgba(20, 184, 166, 0.18), transparent 60%),
      rgba(15, 23, 42, 0.92);
    border-radius: 32px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: var(--shadow-md);
    padding: clamp(2rem, 4vw, 2.7rem);
    display: flex;
    flex-direction: column;
    gap: clamp(1.6rem, 3vw, 2.2rem);
    position: relative;
    overflow: hidden;
  }

  .aproveitamento-head {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .aproveitamento-kicker {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: rgba(148, 163, 184, 0.75);
  }

  .aproveitamento-head h3 {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2rem);
    color: var(--text-primary);
    font-weight: 600;
  }

  .aproveitamento-head p {
    margin: 0;
    color: rgba(203, 213, 225, 0.75);
    max-width: 420px;
  }

  .aproveitamento-ring {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }

  .aproveitamento-ring svg {
    width: 200px;
    height: 200px;
    transform: rotate(-90deg);
  }

  .aproveitamento-ring defs {
    pointer-events: none;
  }

  .ring-track {
    fill: none;
    stroke: rgba(15, 23, 42, 0.65);
    stroke-width: 16;
  }

  .ring-progress {
    fill: none;
    stroke: url(#ring-gradient);
    stroke-linecap: round;
    stroke-width: 16;
    transition: stroke-dashoffset 0.4s ease, stroke 0.3s ease;
  }

  .ring-progress.positivo {
    stroke: url(#ring-gradient-positive);
  }

  .ring-value {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    color: var(--text-primary);
  }

  .ring-value strong {
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
  }

  .ring-value span {
    font-size: 0.92rem;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .ring-value small {
    font-size: 0.82rem;
    color: rgba(148, 163, 184, 0.7);
  }

  .aproveitamento-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .aproveitamento-stat {
    background: rgba(15, 23, 42, 0.85);
    border-radius: var(--radius-sm);
    padding: 0.95rem 1.1rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.12);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .aproveitamento-stat span {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .aproveitamento-stat strong {
    font-size: 1.6rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .aproveitamento-stat small {
    font-size: 0.85rem;
    color: rgba(148, 163, 184, 0.75);
  }

  .aproveitamento-stat.alerta {
    border-color: rgba(249, 115, 22, 0.35);
    box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.2);
  }

  .aproveitamento-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
  }

  .aproveitamento-actions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.8rem 1.6rem;
    border-radius: 999px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    color: #fff;
    box-shadow: 0 16px 38px rgba(59, 130, 246, 0.25);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .aproveitamento-actions button:hover {
    transform: translateY(-2px);
  }

  .aproveitamento-actions .ghost {
    background: rgba(15, 23, 42, 0.6);
    color: var(--text-secondary);
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: none;
  }

  .aproveitamento-side {
    display: grid;
    gap: 1rem;
  }

  .side-card {
    background: rgba(15, 23, 42, 0.92);
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: var(--shadow-md);
    padding: 1.25rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .side-card.summary {
    gap: 0.9rem;
  }

  .side-card.destaque {
    gap: 0.6rem;
  }

  .side-card.destaque.positivo {
    border-color: rgba(34, 197, 94, 0.32);
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.21);
  }

  .side-card.destaque.alerta {
    border-color: rgba(249, 115, 22, 0.32);
    box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.2);
  }

  .side-card h4 {
    margin: 0;
    font-size: 1.05rem;
    color: var(--text-primary);
  }

  .side-card-head span {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .side-card-head strong {
    display: block;
    color: var(--text-primary);
    font-weight: 600;
  }

  .progress {
    position: relative;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.18);
    overflow: hidden;
  }

  .progress span {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(56, 189, 248, 0.9));
  }

  .side-card.destaque.alerta .progress span {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.85), rgba(239, 68, 68, 0.9));
  }


  .card h2 {
    margin-top: 0;
    font-size: 1.35rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .card p {
    color: var(--text-muted);
    line-height: 1.65;
  }

  .simulados-paineis {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    align-items: start;
  }

  .simulados-grid {
    margin-top: 1.5rem;
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: auto;
    max-width: 100%;
  }

  .simulado-box {
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 16px;
    padding: 1.6rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.82);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .simulado-box::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(140deg, rgba(99, 102, 241, 0.6), transparent 55%, rgba(249, 115, 22, 0.45));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .simulado-box:hover,
  .simulado-box:focus-visible {
    transform: translateY(-4px);
    border-color: rgba(99, 102, 241, 0.45);
    box-shadow: 0 18px 36px rgba(99, 102, 241, 0.2);
    outline: none;
  }

  .simulado-box:hover::before,
  .simulado-box:focus-visible::before {
    opacity: 1;
  }

  .simulado-content {
    width: 100%;
    max-width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.45rem 1.3rem;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.92);
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
    position: relative;
    z-index: 1;
  }

  .simulado-box:hover .simulado-content,
  .simulado-box:focus-visible .simulado-content {
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.45);
  }

  .simulado-tag {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(226, 232, 240, 0.62);
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    background: rgba(14, 116, 144, 0.22);
    box-shadow: inset 0 0 0 1px rgba(20, 184, 166, 0.45);
    font-weight: 600;
  }


  .simulado-title {
    font-size: 1.8rem;
    color: var(--text-primary);
    line-height: 1.15;
    font-weight: 600;
  }

  .simulado-foot {
    font-size: 0.85rem;
    padding: 0.35rem 0.95rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.7);
    color: var(--text-secondary);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 600;
  }

  .simulado-foot.disponivel {
    background: rgba(34, 197, 94, 0.18);
    color: #bbf7d0;
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.35);
  }

  .simulado-foot.indisponivel {
    background: rgba(148, 163, 184, 0.22);
    color: rgba(226, 232, 240, 0.75);
  }


  .simulado-box.tema .simulado-foot.indisponivel {
    background: rgba(148, 163, 184, 0.2);
    color: rgba(226, 232, 240, 0.7);
  }

  .simulado-box.indisponivel,
  .simulado-box:disabled {
    cursor: not-allowed;
    opacity: 0.75;
    box-shadow: none;
    transform: none;
  }

  .simulado-box.indisponivel .simulado-content,
  .simulado-box:disabled .simulado-content {
    background: #111827;
  }

  .simulado-box.indisponivel:hover,
  .simulado-box.indisponivel:focus-visible,
  .simulado-box:disabled:hover,
  .simulado-box:disabled:focus-visible {
    transform: none;
    border-color: rgba(148, 163, 184, 0.25);
    box-shadow: none;
  }

  .temas-card {
    display: flex;
    flex-direction: column;
  }

  .temas-grid {
    margin-top: 1.5rem;
    display: grid;
    gap: 1.2rem;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    grid-auto-rows: minmax(150px, auto);
  }

  .simulado-box.tema .simulado-content {
    width: 100%;
    min-height: 0;
    padding: 1.25rem 1.15rem;
    justify-content: center;
    align-items: center;
    gap: 0.6rem;
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.22);
  }

  .simulado-box.tema .tema-titulo {
    font-size: clamp(0.92rem, 0.75vw + 0.85rem, 1.15rem);
    line-height: 1.4;
    word-break: break-word;
    hyphens: auto;
    color: #f1f5f9;
    text-align: center;
  }

  .cabecalho.seção {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .badge {
    padding: 0.32rem 0.8rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  }

  .badge.sucesso {
    background: rgba(34, 197, 94, 0.2);
    color: #bbf7d0;
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.35);
  }

  .badge.neutro {
    background: rgba(148, 163, 184, 0.18);
    color: var(--text-muted);
  }

  .badge.erro {
    background: rgba(248, 113, 113, 0.2);
    color: #fecaca;
    box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.35);
  }

  .skeleton-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .skeleton {
    height: 160px;
    border-radius: 16px;
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }

  .skeleton-grid.temas {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 200px;
  }

  .vazio {
    color: var(--text-muted);
    font-weight: 500;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .erro {
    color: #fecaca;
    background: rgba(248, 113, 113, 0.16);
    border-radius: var(--radius-sm);
    border: 1px solid rgba(248, 113, 113, 0.35);
    padding: 0.75rem 1rem;
    margin-top: 0.75rem;
  }

  @media (max-width: 720px) {
    .hero-card {
      padding: 2rem 1.5rem 2.25rem;
    }

    .hero-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.85rem;
    }

    .hero-logo {
      width: 54px;
      height: 54px;
    }

    .botao-sair {
      width: 100%;
      text-align: center;
      justify-content: center;
      margin-top: 0.25rem;
    }

    .hero-metrics {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .hero-actions {
      width: 100%;
      align-items: stretch;
    }

    .desempenho-grid {
      grid-template-columns: 1fr;
    }

    .avatar-aproveitamento {
      width: 120px;
      height: 120px;
    }

    .temas-destaque {
      grid-template-columns: 1fr;
    }

    .simulados-paineis {
      grid-template-columns: 1fr;
    }

    .simulados-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .temas-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

  }

  /* Responsividade para telas muito pequenas */
  @media (max-width: 480px) {
    .simulados-grid {
      grid-template-columns: 1fr;
    }

    .temas-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
