<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  interface Usuario {
    id: string;
    nome: string;
    email: string;
    whatsapp?: string;
    status?: string;
    data_cadastro?: string;
    papel?: string;
  }

  const logoFrUrl = '/FULLSTACK3.png';

  export let data: PageData;
  const supabase = data.supabase;

  function obterIniciais(nome: string) {
    if (!nome) return 'AL';
    const partes = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!partes.length) return 'AL';
    return partes.map((parte) => (parte[0] ? parte[0].toUpperCase() : '')).join('') || 'AL';
  }

  function verificarSeEhAdmin(usuario: Usuario | null, perfil: Usuario | null, metadataUser?: any) {
    // 1. Verificar se tem metadata de admin
    if (metadataUser) {
      const metadata = metadataUser;
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string' && ehValorAdmin(value)) return true;
        if (Array.isArray(value) && value.some(v => typeof v === 'string' && ehValorAdmin(v))) return true;
      }
    }

    // 2. Verificar se tem papel de admin na tabela usuarios
    if (perfil && perfil.papel && ehValorAdmin(perfil.papel)) return true;

    return false;
  }

  function ehValorAdmin(valor: string) {
    const normalizado = valor.trim().toLowerCase();
    return normalizado === 'admin' || normalizado === 'administrador';
  }

  let carregando = true;
  let usuarioAuth: Usuario | null = null;
  let perfil: Usuario | null = null;
  let ehAdmin = false;
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
  let desempenhoTotalRespondidas = 0;
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

    // Verificar se o usuário é admin
    ehAdmin = verificarSeEhAdmin(usuarioAuth, perfil, session.user.user_metadata);

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
    desempenhoTotalRespondidas = 0;
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
        desempenhoTotalRespondidas += 1;

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

  $: taxaErro = desempenhoTotalRespondidas > 0 
    ? Math.max(0, Math.round(((desempenhoTotalRespondidas - desempenhoTotalAcertos) / desempenhoTotalRespondidas) * 100))
    : 0;

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
      <div class="hero-overlays">
        <div class="hero-overlay overlay-a"></div>
        <div class="hero-overlay overlay-b"></div>
        <div class="hero-overlay overlay-c"></div>
      </div>

      <!-- Logo no topo -->
      <div class="top-logo">
        <img src={logoFrUrl} alt="FullStack Educacional" loading="lazy" />
        <span>PAINEL DO USUÁRIO</span>
      </div>

      <div class="hero-header">
        <div class="hero-user">
          <div class="hero-avatar">
            <span>{iniciaisAvatar}</span>
            <div class="avatar-glow"></div>
          </div>
          <div class="hero-user-text">
            <strong>{nomePrincipal || 'Aluno CEA'}</strong>
            {#if emailPrincipal}
              <small>{emailPrincipal}</small>
            {/if}
            <div class="hero-badges">
              <span class="hero-sub brand">FullStack Educacional</span>
              <span class="hero-sub produto">Simulado CEA</span>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <div class="action-buttons">
            <span class={`status-pill ${statusClass}`}>
              Status: {statusTexto}
            </span>
            {#if ehAdmin}
              <button class="hero-action botao-admin" on:click={() => goto('/admin')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Painel Admin
              </button>
            {/if}
            <button class="hero-action botao-sair" on:click={sair}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-value">{totalSimulados}</span>
            <span class="stat-label">Simulados</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-value">{totalQuestoes}</span>
            <span class="stat-label">Questões</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-value">{totalTemas}</span>
            <span class="stat-label">Temas</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-value">{aproveitamentoGeral !== null ? `${aproveitamentoGeral}%` : '--'}</span>
            <span class="stat-label">Aproveitamento</span>
          </div>
        </div>
      </div>
    </section>
  </header>

  <main class="main-content">
    <section class="performance-dashboard">
      <div class="dashboard-header">
        <div class="header-content">
          <h2>Seu aproveitamento</h2>
          <p>Acompanhe seu progresso e desempenho nos simulados</p>
        </div>
        {#if carregandoDesempenho}
          <span class="badge loading">Carregando...</span>
        {:else if erroDesempenho}
          <span class="badge error">{erroDesempenho}</span>
        {/if}
      </div>

      {#if carregandoDesempenho}
        <div class="performance-skeleton">
          <div class="skeleton-ring"></div>
          <div class="skeleton-stats">
            <div class="skeleton-bar"></div>
            <div class="skeleton-bar"></div>
            <div class="skeleton-bar"></div>
          </div>
        </div>
      {:else if erroDesempenho}
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <p>{erroDesempenho}</p>
        </div>
      {:else if aproveitamentoGeral === null}
        <div class="empty-state">
          <h3>Nenhum resultado ainda</h3>
          <p>Complete um simulado para visualizar seu desempenho aqui.</p>
          <button class="btn-primary" on:click={() => goto('/simulados')}>
            Iniciar primeiro simulado
          </button>
        </div>
      {:else}
        <div class="performance-grid-horizontal">
          <!-- Left: Progress Ring -->
          <div class="performance-ring-section">
            <div class="progress-section">
              <div class="progress-ring-container">
                <div class="progress-ring" role="img" aria-label={`Aproveitamento de ${aproveitamentoGeral}%`}>
                  <svg viewBox="0 0 120 120">
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
                    <circle class="ring-track" cx="60" cy="60" r="45" />
                    <circle
                      class={`ring-progress ${aproveitamentoGeral >= 70 ? 'excellent' : aproveitamentoGeral >= 50 ? 'good' : 'needs-improvement'}`}
                      cx="60"
                      cy="60"
                      r="45"
                      stroke-dasharray={2 * Math.PI * 45}
                      stroke-dashoffset={2 * Math.PI * 45 - (aproveitamentoGeral / 100) * 2 * Math.PI * 45}
                    />
                  </svg>
                  <div class="ring-content">
                    <div class="ring-percentage">{aproveitamentoGeral}%</div>
                    <div class="ring-label">Aproveitamento</div>
                    <div class="ring-sublabel">{simuladosResumo.length} simulado(s)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Stats Cards -->
          <div class="performance-stats-section">
            <div class="horizontal-stats-grid">
              <div class="stat-bullet success">
                <div class="stat-bullet-indicator"></div>
                <div class="stat-bullet-content">
                  <div class="stat-bullet-number">{desempenhoTotalAcertos}</div>
                  <div class="stat-bullet-label">Acertos</div>
                </div>
              </div>

              <div class="stat-bullet neutral">
                <div class="stat-bullet-indicator"></div>
                <div class="stat-bullet-content">
                  <div class="stat-bullet-number">{desempenhoTotalRespondidas}</div>
                  <div class="stat-bullet-label">Questões</div>
                </div>
              </div>

              <div class="stat-bullet warning">
                <div class="stat-bullet-indicator"></div>
                <div class="stat-bullet-content">
                  <div class="stat-bullet-number">{taxaErro}%</div>
                  <div class="stat-bullet-label">Taxa de erro</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Insights Section Below -->
        <div class="insights-section">
          <h3>Insights de Performance</h3>
          <div class="insights-container">
            <div class="insights-grid-horizontal">
              {#if melhorTema}
                  <div class="insight-card best-performance">
                    <div class="insight-header">
                      <div class="insight-icon">�</div>
                      <div class="insight-meta">
                        <div class="insight-title">Melhor Desempenho</div>
                        <div class="insight-percentage">{melhorTema.percentual}%</div>
                      </div>
                    </div>
                    <div class="insight-content">
                      <div class="insight-subject">{melhorTema.tema}</div>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: {melhorTema.percentual}%"></div>
                      </div>
                    </div>
                  </div>
                {/if}

                {#if temaReforcar && temaReforcar !== melhorTema}
                  <div class="insight-card needs-attention">
                    <div class="insight-header">
                      <div class="insight-meta">
                        <div class="insight-title">Foco para Revisão</div>
                        <div class="insight-percentage">{temaReforcar.percentual}%</div>
                      </div>
                    </div>
                    <div class="insight-content">
                      <div class="insight-subject">{temaReforcar.tema}</div>
                      <div class="progress-bar">
                        <div class="progress-fill warning" style="width: {temaReforcar.percentual}%"></div>
                      </div>
                    </div>
                  </div>
                {/if}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
          <div class="performance-actions">
            <button class="btn-primary large" on:click={() => goto('/simulados')}>
              <span class="btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.5 16.5c-1.5 1.5-1.5 4.5 0 6s4.5 1.5 6 0L16 17l-4-4L4.5 16.5z"/>
                  <path d="M13.5 6.5a4.95 4.95 0 0 1 7 7l-2 2"/>
                  <path d="M9 11l-4 4"/>
                  <path d="M5 21l3-3"/>
                </svg>
              </span>
              Iniciar novo simulado
            </button>
            <button class="btn-secondary large" on:click={() => goto('/painel?historico=1')}>
              <span class="btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v5h5"/>
                  <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
                  <path d="M12 7v5l4 2"/>
                </svg>
              </span>
              Ver histórico completo
            </button>
            {#if ehAdmin}
              <button class="btn-admin large" on:click={() => goto('/admin')}>
                <span class="btn-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6v6H9z"/>
                    <path d="M21 14H3"/>
                    <path d="M14 3v18"/>
                  </svg>
                </span>
                Painel de Administração
              </button>
            {/if}
          </div>
      {/if}
    </section>

    <!-- Seções organizadas em layout otimizado -->
    <div class="dashboard-sections">
      <!-- Coluna esquerda: Simulados por número -->
      <section class="section-card simulados-section">
        <header class="section-header">
          <div class="section-title-group">
            <h2 class="section-title">
              <span class="section-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </span>
              Simulados por número
            </h2>
            <p class="section-subtitle">Escolha um simulado para praticar</p>
          </div>
          {#if carregandoSimulados}
            <span class="badge neutro">Carregando...</span>
          {:else if erroSimulados}
            <span class="badge erro">{erroSimulados}</span>
          {/if}
        </header>

        <div class="section-content">
          {#if carregandoSimulados}
            <div class="skeleton-grid">
              {#each Array(6) as _, index}
                <div class="skeleton simulado-skeleton" aria-hidden="true"></div>
              {/each}
            </div>
          {:else if erroSimulados}
            <div class="error-state">
              <p class="erro">{erroSimulados}</p>
            </div>
          {:else}
            <div class="simulados-grid compact">
              {#each simuladosCards as simulado}
                <button
                  type="button"
                  class="simulado-item"
                  class:disponivel={simulado.disponivel}
                  class:indisponivel={!simulado.disponivel}
                  on:click={() => simulado.disponivel && iniciarSimulado(simulado.numero)}
                  disabled={!simulado.disponivel}
                  title={simulado.disponivel ? `Iniciar Simulado ${simulado.numero}` : 'Em breve'}
                >
                  <div class="simulado-number">
                    <span class="number-badge">{simulado.numero}</span>
                  </div>
                  <div class="simulado-status">
                    {#if simulado.disponivel}
                      <span class="status-text disponivel">Disponível</span>
                    {:else}
                      <span class="status-text indisponivel">Em breve</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <!-- Coluna direita: Filtrar por tema -->
      <section class="section-card temas-section">
        <header class="section-header">
          <div class="section-title-group">
            <h2 class="section-title">
              <span class="section-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </span>
              Filtrar por tema
            </h2>
            <p class="section-subtitle">Pratique por assunto específico</p>
          </div>
          {#if carregandoSimulados}
            <span class="badge neutro">Carregando...</span>
          {:else if erroSimulados}
            <span class="badge erro">{erroSimulados}</span>
          {/if}
        </header>

        <div class="section-content">
          {#if carregandoSimulados}
            <div class="skeleton-grid temas">
              {#each Array(3) as _, index}
                <div class="skeleton tema-skeleton" aria-hidden="true"></div>
              {/each}
            </div>
          {:else if erroSimulados}
            <div class="error-state">
              <p class="erro">{erroSimulados}</p>
            </div>
          {:else if !temasCards.length}
            <div class="empty-state">
              <p class="vazio">Cadastre temas para habilitar os filtros por assunto.</p>
            </div>
          {:else}
            <div class="temas-grid">
              {#each temasCards as tema}
                <button
                  type="button"
                  class="tema-item"
                  class:disponivel={tema.disponivel}
                  class:indisponivel={!tema.disponivel}
                  on:click={() => tema.disponivel && iniciarPorTema(tema.tema)}
                  disabled={!tema.disponivel}
                  title={tema.disponivel ? `Filtrar por: ${tema.tema}` : 'Em breve'}
                >
                  <div class="tema-content">
                    <h3 class="tema-title">{tema.tema}</h3>
                    <div class="tema-info">
                      {#if !tema.disponivel}
                        <span class="status-text indisponivel">Em breve</span>
                      {/if}
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    </div>
  </main>
</div>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 4vw, 2.4rem) 2rem;
  }

  .topo {
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
  }

  .hero-card {
    position: relative;
    overflow: hidden;
    border-radius: clamp(1rem, 2vw, 1.5rem);
    padding: clamp(1rem, 3vw, 1.75rem);
    background: 
      linear-gradient(135deg, rgba(29, 78, 216, 0.95) 0%, rgba(42, 67, 171, 0.9) 40%, rgba(15, 118, 110, 0.85) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    backdrop-filter: blur(20px);
  }

  .hero-overlays {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .hero-overlay {
    position: absolute;
    border-radius: 50%;
    opacity: 0.4;
    filter: blur(60px);
    animation: float 8s ease-in-out infinite;
  }

  .overlay-a {
    width: clamp(200px, 30vw, 340px);
    height: clamp(200px, 30vw, 340px);
    top: -20%;
    right: -10%;
    background: radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.7), transparent 65%);
    animation-delay: 0s;
  }

  .overlay-b {
    width: clamp(150px, 25vw, 240px);
    height: clamp(150px, 25vw, 240px);
    bottom: -15%;
    left: -10%;
    background: radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.5), transparent 70%);
    animation-delay: -4s;
  }

  .overlay-c {
    width: clamp(100px, 20vw, 180px);
    height: clamp(100px, 20vw, 180px);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.3), transparent 70%);
    animation-delay: -2s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    33% { transform: translateY(-10px) scale(1.02); }
    66% { transform: translateY(10px) scale(0.98); }
  }

  /* ======================
     TOP LOGO STYLES
     ====================== */
  .top-logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    margin-bottom: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.25rem, 0.5vw, 0.5rem);
    /* Removendo o fundo azul escuro */
    background: transparent;
    border-radius: 0;
    border: none;
    backdrop-filter: none;
    box-shadow: none;
  }

  .top-logo img {
    width: clamp(50px, 8vw, 80px);
    height: clamp(50px, 8vw, 80px);
    object-fit: contain;
    filter: drop-shadow(0 8px 16px rgba(59, 130, 246, 0.6)) brightness(1.2) contrast(1.3);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 6px;
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .top-logo span {
    font-size: clamp(0.9rem, 1.8vw, 1.1rem);
    letter-spacing: 0.1em;
    color: var(--text-primary);
    text-transform: uppercase;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .top-logo:hover img {
    transform: scale(1.1) rotate(5deg);
    filter: drop-shadow(0 12px 24px rgba(59, 130, 246, 0.8)) brightness(1.3) contrast(1.4);
    box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
  }

  .hero-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: clamp(0.75rem, 2vw, 1.25rem);
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
    margin-bottom: clamp(0.75rem, 2vw, 1rem);
  }

  .hero-user {
    display: flex;
    align-items: center;
    gap: clamp(0.75rem, 2vw, 1rem);
    flex: 1 1 250px;
    min-width: 0;
  }

  .hero-avatar {
    position: relative;
    width: clamp(50px, 6vw, 70px);
    height: clamp(50px, 6vw, 70px);
    border-radius: clamp(12px, 2vw, 20px);
    background: 
      linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
  }

  .hero-avatar span {
    position: relative;
    z-index: 2;
  }

  .avatar-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(14, 165, 233, 0.3));
    border-radius: inherit;
    animation: glow 3s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.05); }
  }

  .hero-user-text {
    display: flex;
    flex-direction: column;
    gap: clamp(0.25rem, 0.5vw, 0.4rem);
    text-align: left;
    min-width: 0;
    flex: 1;
  }

  .hero-user-text strong {
    font-size: clamp(1.1rem, 2.5vw, 1.4rem);
    color: var(--text-primary);
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    word-break: break-word;
  }

  .hero-user-text small {
    color: rgba(255, 255, 255, 0.8);
    font-size: clamp(0.85rem, 1.8vw, 1rem);
    word-break: break-all;
  }

  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .hero-sub {
    font-size: clamp(0.7rem, 1.5vw, 0.85rem);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(15, 23, 42, 0.6);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    min-width: 200px;
  }

  .hero-brand {
    display: inline-flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
    background: rgba(15, 23, 42, 0.8);
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .hero-brand img {
    width: clamp(50px, 8vw, 80px);
    height: clamp(50px, 8vw, 80px);
    object-fit: contain;
    filter: drop-shadow(0 8px 16px rgba(59, 130, 246, 0.5)) brightness(1.1) contrast(1.2);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 6px;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .hero-brand span {
    font-size: clamp(0.75rem, 1.5vw, 0.9rem);
    letter-spacing: 0.08em;
    color: var(--text-primary);
    text-transform: uppercase;
    font-weight: 600;
  }
  
  .hero-brand:hover img {
    transform: scale(1.1);
    filter: drop-shadow(0 12px 24px rgba(59, 130, 246, 0.7)) brightness(1.2) contrast(1.3);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    width: 100%;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.75rem, 1.5vw, 1.2rem);
    border-radius: 999px;
    font-size: clamp(0.75rem, 1.5vw, 0.85rem);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 600;
    background: rgba(34, 197, 94, 0.2);
    color: #bbf7d0;
    border: 1px solid rgba(34, 197, 94, 0.4);
    backdrop-filter: blur(10px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(34, 197, 94, 0.2);
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse-status 2s ease-in-out infinite;
  }

  @keyframes pulse-status {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.2); }
  }

  .status-pill:not(.ativo) {
    background: rgba(248, 113, 113, 0.2);
    color: #fecaca;
    border-color: rgba(248, 113, 113, 0.4);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(248, 113, 113, 0.2);
  }

  .status-pill:not(.ativo) .status-indicator {
    background: #ef4444;
  }

  .hero-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: clamp(0.6rem, 1.2vw, 0.8rem) clamp(1rem, 2vw, 1.6rem);
    border: none;
    border-radius: 999px;
    font-size: clamp(0.85rem, 1.5vw, 0.95rem);
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    box-shadow: 
      0 10px 25px rgba(220, 38, 38, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .hero-action:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 15px 30px rgba(220, 38, 38, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: clamp(0.75rem, 2vw, 1rem);
    position: relative;
    z-index: 1;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2vw, 1.25rem);
    background: rgba(15, 23, 42, 0.6);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 8px 16px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 12px 24px rgba(99, 102, 241, 0.2);
  }

  .stat-icon {
    font-size: clamp(1.2rem, 2.5vw, 1.6rem);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .stat-icon:empty {
    display: none;
  }

  .stat-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1;
  }

  .stat-value {
    font-size: clamp(1.1rem, 2.2vw, 1.4rem);
    font-weight: 700;
    color: var(--text-primary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .stat-label {
    font-size: clamp(0.7rem, 1.4vw, 0.8rem);
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  main {
    display: flex;
    flex-direction: column;
    gap: clamp(0.75rem, 2vw, 1rem);
  }

  .card {
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.9);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    padding: clamp(1rem, 2vw, 1.75rem);
    color: var(--text-secondary);
    transition: all 0.3s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 35px 60px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .card.desempenho {
    display: flex;
    flex-direction: column;
    gap: clamp(0.75rem, 2vw, 1rem);
  }

  .desempenho-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* ==============================================
     MAIN CONTENT & LAYOUT
  ============================================== */
  .main-content {
    width: 100%;
    margin-top: clamp(0.75rem, 2vw, 1rem);
  }

  .performance-dashboard {
    background: 
      linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%),
      rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    padding: clamp(0.75rem, 2vw, 1.25rem);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .performance-dashboard::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  }

  /* ==============================================
     DASHBOARD HEADER
  ============================================== */
  .dashboard-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: clamp(0.75rem, 2vw, 1rem);
    gap: 1rem;
  }

  .header-content h2 {
    margin: 0 0 0.5rem 0;
    font-size: clamp(1.75rem, 3.5vw, 2.25rem);
    font-weight: 800;
    color: var(--text-primary);
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-content p {
    margin: 0;
    font-size: clamp(0.9rem, 1.8vw, 1.1rem);
    color: var(--text-muted);
    line-height: 1.6;
  }

  .badge {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .badge.loading {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .badge.error {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  /* ==============================================
     PERFORMANCE GRID LAYOUT
  ============================================== */
  .performance-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: clamp(1rem, 3vw, 2rem);
    align-items: start;
    margin-bottom: clamp(1rem, 3vw, 2rem);
  }

  .performance-grid-horizontal {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: clamp(1.5rem, 3vw, 2.5rem);
    align-items: center;
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
  }

  .performance-ring-section {
    display: flex;
    justify-content: center;
  }

  .performance-stats-section {
    display: flex;
    align-items: center;
  }

  .horizontal-stats-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .stat-bullet {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }

  .stat-bullet:hover {
    transform: translateX(4px);
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .stat-bullet-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .stat-bullet.success .stat-bullet-indicator {
    background: linear-gradient(135deg, #34d399, #14b8a6);
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.4);
  }

  .stat-bullet.neutral .stat-bullet-indicator {
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
  }

  .stat-bullet.warning .stat-bullet-indicator {
    background: linear-gradient(135deg, #f97316, #ea580c);
    box-shadow: 0 0 12px rgba(249, 115, 22, 0.4);
  }

  .stat-bullet-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .stat-bullet-number {
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }

  .stat-bullet-label {
    font-size: clamp(0.75rem, 1.5vw, 0.85rem);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .insights-grid-horizontal {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .insights-grid-horizontal .insight-card {
    flex: 1;
    min-width: 280px;
  }

  .performance-grid-new {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: clamp(1rem, 2vw, 1.5rem);
    align-items: start;
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
  }

  .performance-main-new {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .performance-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ==============================================
     PROGRESS RING SECTION
  ============================================== */
  .performance-main {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .progress-ring-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-ring {
    position: relative;
    width: clamp(140px, 18vw, 180px);
    height: clamp(140px, 18vw, 180px);
  }

  .progress-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
  }

  .ring-track {
    fill: none;
    stroke: rgba(30, 41, 59, 0.8);
    stroke-width: 8;
  }

  .ring-progress {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ring-progress.excellent {
    stroke: url(#ring-gradient-positive);
  }

  .ring-progress.good {
    stroke: url(#ring-gradient);
  }

  .ring-progress.needs-improvement {
    stroke: linear-gradient(135deg, #f59e0b, #f97316);
  }

  .ring-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .ring-percentage {
    font-size: clamp(2.5rem, 5vw, 3.2rem);
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .ring-label {
    font-size: clamp(0.9rem, 1.8vw, 1.1rem);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .ring-sublabel {
    font-size: clamp(0.8rem, 1.6vw, 0.95rem);
    color: rgba(148, 163, 184, 0.7);
  }

  /* ==============================================
     PERFORMANCE STATUS
  ============================================== */
  .performance-status {
    width: 100%;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .status-indicator.excellent {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(52, 211, 153, 0.05));
    border-color: rgba(34, 197, 94, 0.3);
  }

  .status-indicator.good {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05));
    border-color: rgba(59, 130, 246, 0.3);
  }

  .status-indicator.needs-improvement {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.05));
    border-color: rgba(245, 158, 11, 0.3);
  }

  .status-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .status-text {
    flex: 1;
  }

  .status-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .status-subtitle {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* ==============================================
     STATISTICS SECTION
  ============================================== */
  .performance-stats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    transition: all 0.3s ease;
  }

  .stat-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .stat-item.success {
    border-left: 4px solid #22c55e;
  }

  .stat-item.neutral {
    border-left: 4px solid #3b82f6;
  }

  .stat-item.warning {
    border-left: 4px solid #f59e0b;
  }

  .stat-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-number {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .stat-detail {
    font-size: 0.75rem;
    color: rgba(148, 163, 184, 0.8);
  }

  /* ==============================================
     SMALL STATS CARDS
  ============================================== */
  .small-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    width: 100%;
    max-width: 420px;
  }

  .small-stat-card {
    padding: 0.75rem;
    border-radius: 0.625rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.375rem;
    transition: all 0.3s ease;
  }

  .small-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .small-stat-card.success {
    border-left: 3px solid #34d399;
  }

  .small-stat-card.neutral {
    border-left: 3px solid #38bdf8;
  }

  .small-stat-card.warning {
    border-left: 3px solid #f97316;
  }

  .small-stat-number {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .small-stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ==============================================
     INSIGHTS SECTION
  ============================================== */
  .insights-section {
    margin-top: 0.5rem;
  }

  .insights-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .insights-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .insights-container {
    width: 100%;
    max-width: 100%;
  }

  .insights-grid-horizontal {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    width: 100%;
  }

  .insight-card {
    padding: 1.25rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .insight-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .insight-card.best-performance {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(52, 211, 153, 0.05));
    border-color: rgba(34, 197, 94, 0.3);
  }

  .insight-card.needs-attention {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.05));
    border-color: rgba(245, 158, 11, 0.3);
  }

  .insight-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .insight-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    flex-shrink: 0;
    box-shadow: 
      0 4px 12px rgba(34, 197, 94, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }

  .needs-attention .insight-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    box-shadow: 
      0 4px 12px rgba(245, 158, 11, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .insight-icon:empty {
    display: none;
  }

  .insight-icon svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.5;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  }

  .insight-meta {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .insight-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .insight-percentage {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .insight-content {
    margin-top: 0.5rem;
  }

  .insight-subject {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e 0%, #16a34a 50%, #15803d 100%);
    border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(34, 197, 94, 0.4);
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer-progress 2.5s infinite;
  }

  @keyframes shimmer-progress {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  .progress-fill.warning {
    background: linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
    box-shadow: 0 1px 3px rgba(245, 158, 11, 0.4);
  }

  /* ==============================================
     ACTION BUTTONS
  ============================================== */
  .performance-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: nowrap;
    align-items: center;
  }

  .btn-primary, .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.675rem 1.25rem;
    border-radius: 0.625rem;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
    text-decoration: none;
    position: relative;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }

  .btn-primary.large, .btn-secondary.large {
    padding: 1rem 2rem;
    font-size: 1rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .btn-primary.large::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.6s ease;
  }

  .btn-primary.large:hover::before {
    left: 100%;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
    color: white;
    box-shadow: 
      0 8px 25px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .btn-primary:hover {
    transform: translateY(-3px) scale(1.02);
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
    box-shadow: 
      0 15px 35px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .btn-secondary {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn-secondary:hover {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
    color: #f1f5f9;
    transform: translateY(-3px) scale(1.02);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 8px 20px rgba(99, 102, 241, 0.3);
  }

  .btn-admin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: none;
    text-decoration: none;
    position: relative;
    overflow: hidden;
    flex: 1;
    min-width: 0;
    background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
    color: white;
    box-shadow: 
      0 8px 25px rgba(5, 150, 105, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .btn-admin.large {
    padding: 1rem 2rem;
    font-size: 1rem;
  }

  .btn-admin:hover {
    transform: translateY(-3px) scale(1.02);
    background: linear-gradient(135deg, #047857 0%, #065f46 50%, #064e3b 100%);
    box-shadow: 
      0 15px 35px rgba(5, 150, 105, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .botao-admin {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .botao-admin:hover {
    box-shadow: 
      0 15px 30px rgba(124, 58, 237, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .btn-icon {
    font-size: 1rem;
  }

  .btn-icon:empty {
    display: none;
  }

  /* ==============================================
     LOADING & ERROR STATES
  ============================================== */
  .performance-skeleton {
    display: flex;
    align-items: center;
    gap: 3rem;
    padding: 3rem 0;
  }

  .skeleton-ring {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: linear-gradient(90deg, rgba(30, 41, 59, 0.8) 25%, rgba(51, 65, 85, 0.8) 50%, rgba(30, 41, 59, 0.8) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-stats {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .skeleton-bar {
    height: 60px;
    border-radius: 0.5rem;
    background: linear-gradient(90deg, rgba(30, 41, 59, 0.8) 25%, rgba(51, 65, 85, 0.8) 50%, rgba(30, 41, 59, 0.8) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-bar:nth-child(2) {
    animation-delay: 0.2s;
  }

  .skeleton-bar:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .error-state, .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .error-icon, .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-icon:empty, .empty-icon:empty {
    display: none;
    margin-bottom: 0;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: var(--text-primary);
  }

  .empty-state p {
    margin: 0 0 2rem 0;
    color: var(--text-muted);
    max-width: 24rem;
    margin-left: auto;
    margin-right: auto;
  }

  .desempenho-skeleton {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .desempenho-skeleton .skeleton.redondo {
    width: clamp(100px, 15vw, 140px);
    height: clamp(100px, 15vw, 140px);
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

  .aproveitamento-horizontal {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: clamp(2rem, 5vw, 3rem);
    align-items: start;
  }

  .aproveitamento-head {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    margin-bottom: 1.5rem;
  }

  .head-content {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
  }

  .aproveitamento-ring-compact {
    position: relative;
    width: clamp(120px, 20vw, 150px);
    height: clamp(120px, 20vw, 150px);
    flex-shrink: 0;
  }

  .aproveitamento-ring-compact svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .aproveitamento-stats-horizontal {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .stat-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
  }

  .destaque-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .aproveitamento-kicker {
    font-size: clamp(0.7rem, 1.4vw, 0.8rem);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: rgba(148, 163, 184, 0.75);
    font-weight: 600;
  }

  .aproveitamento-head h3 {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 2rem);
    color: var(--text-primary);
    font-weight: 700;
    line-height: 1.2;
  }

  .aproveitamento-head p {
    margin: 0;
    color: rgba(203, 213, 225, 0.8);
    max-width: 420px;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    line-height: 1.6;
  }

  .aproveitamento-ring {
    position: relative;
    width: clamp(140px, 25vw, 200px);
    height: clamp(140px, 25vw, 200px);
    margin: 0 auto;
  }



  .ring-track {
    fill: none;
    stroke: rgba(15, 23, 42, 0.7);
    stroke-width: 12;
  }

  .ring-progress {
    fill: none;
    stroke: url(#ring-gradient);
    stroke-linecap: round;
    stroke-width: 12;
    transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease;
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
    gap: clamp(0.25rem, 0.5vw, 0.4rem);
    color: var(--text-primary);
  }

  .ring-value strong {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .ring-value span {
    font-size: clamp(0.8rem, 1.6vw, 0.95rem);
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 600;
  }

  .ring-value small {
    font-size: clamp(0.7rem, 1.4vw, 0.8rem);
    color: rgba(148, 163, 184, 0.7);
    text-align: center;
  }

  .aproveitamento-stat {
    background: rgba(15, 23, 42, 0.9);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.75rem, 1.5vw, 1rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.3s ease;
  }

  .aproveitamento-stat:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 8px 16px rgba(99, 102, 241, 0.2);
  }

  .aproveitamento-stat .indicador {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .aproveitamento-stat .indicador.ganho {
    background: linear-gradient(135deg, #34d399, #14b8a6);
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.4);
  }

  .aproveitamento-stat .indicador.neutro {
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
  }

  .aproveitamento-stat .indicador.alerta {
    background: linear-gradient(135deg, #f97316, #ea580c);
    box-shadow: 0 0 12px rgba(249, 115, 22, 0.4);
  }

  .aproveitamento-stat .stat-content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .aproveitamento-stat .stat-content strong {
    font-size: clamp(1.1rem, 2.2vw, 1.4rem);
    color: var(--text-primary);
    font-weight: 700;
    line-height: 1;
  }

  .aproveitamento-stat .stat-content span {
    font-size: clamp(0.7rem, 1.4vw, 0.8rem);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 600;
  }

  .aproveitamento-stat .stat-content small {
    font-size: clamp(0.65rem, 1.3vw, 0.75rem);
    color: rgba(148, 163, 184, 0.75);
    line-height: 1.3;
  }

  .destaque-card {
    background: rgba(15, 23, 42, 0.9);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .destaque-card.positivo {
    border-color: rgba(52, 211, 153, 0.3);
    box-shadow: 0 4px 12px rgba(52, 211, 153, 0.1);
  }

  .destaque-card.alerta {
    border-color: rgba(249, 115, 22, 0.3);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);
  }

  .destaque-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .destaque-label {
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 600;
  }

  .destaque-progress {
    width: 40px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .destaque-progress span {
    display: block;
    height: 100%;
    background: linear-gradient(135deg, #34d399, #14b8a6);
    border-radius: 2px;
    transition: width 0.6s ease;
  }

  .destaque-card.alerta .destaque-progress span {
    background: linear-gradient(135deg, #f97316, #ea580c);
  }

  .destaque-card strong {
    font-size: 0.9rem;
    color: var(--text-primary);
    font-weight: 600;
    line-height: 1.3;
  }

  .destaque-card small {
    font-size: 0.75rem;
    color: rgba(148, 163, 184, 0.75);
  }

  .aproveitamento-stat.alerta {
    border-color: rgba(249, 115, 22, 0.3);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(249, 115, 22, 0.2);
  }

  .aproveitamento-actions {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(0.5rem, 1vw, 0.85rem);
  }

  .aproveitamento-actions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: clamp(0.6rem, 1.2vw, 0.8rem) clamp(1.2rem, 2.5vw, 1.6rem);
    border-radius: 999px;
    border: none;
    font-weight: 600;
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    cursor: pointer;
    background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    color: #fff;
    box-shadow: 
      0 10px 25px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .aproveitamento-actions button:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 15px 30px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .aproveitamento-actions .ghost {
    background: rgba(15, 23, 42, 0.7);
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .aproveitamento-actions .ghost:hover {
    background: rgba(30, 41, 59, 0.8);
    color: var(--text-primary);
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 8px 16px rgba(99, 102, 241, 0.2);
  }

  .aproveitamento-side {
    display: grid;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    align-content: start;
  }

  .side-card {
    background: rgba(15, 23, 42, 0.95);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 10px 25px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    padding: clamp(1rem, 2vw, 1.4rem);
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    transition: all 0.3s ease;
  }

  .side-card:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 
      0 15px 30px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .side-card.summary {
    gap: clamp(0.75rem, 1.5vw, 0.9rem);
  }

  .side-card.destaque {
    gap: clamp(0.5rem, 1vw, 0.6rem);
  }

  .side-card.destaque.positivo {
    border-color: rgba(34, 197, 94, 0.3);
    box-shadow: 
      0 10px 25px rgba(34, 197, 94, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .side-card.destaque.alerta {
    border-color: rgba(249, 115, 22, 0.3);
    box-shadow: 
      0 10px 25px rgba(249, 115, 22, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }



  .timeline-item {
    display: flex;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.6rem, 1.2vw, 0.75rem) clamp(0.75rem, 1.5vw, 0.9rem);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
    transition: all 0.3s ease;
  }

  .timeline-item:hover {
    border-color: rgba(99, 102, 241, 0.2);
    background: rgba(30, 41, 59, 0.9);
  }

  .indicador {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 0.3rem;
    flex-shrink: 0;
  }

  .indicador.ganho { 
    background: #22c55e; 
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }
  .indicador.neutro { 
    background: #38bdf8; 
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
  }
  .indicador.alerta { 
    background: #f97316; 
    box-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
  }



  .card h2 {
    margin-top: 0;
    font-size: clamp(1.2rem, 2.5vw, 1.4rem);
    color: var(--text-primary);
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .card p {
    color: var(--text-muted);
    line-height: 1.65;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
  }

  /* Layout principal das seções */
  .dashboard-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(1.5rem, 3vw, 2rem);
    align-items: start;
    margin-top: clamp(2rem, 4vw, 2.5rem);
  }

  /* Cards das seções */
  .section-card {
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%),
      rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    padding: clamp(1.5rem, 3vw, 2rem);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    height: fit-content;
  }

  .section-card:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  /* Cabeçalhos das seções */
  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: clamp(1.5rem, 3vw, 2rem);
    padding-bottom: clamp(1rem, 2vw, 1.25rem);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .section-title-group {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    flex: 1;
  }

  .section-title {
    font-size: clamp(1.3rem, 2.6vw, 1.6rem);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    line-height: 1.2;
  }

  .section-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
    transition: all 0.3s ease;
  }

  .section-icon svg {
    width: 20px;
    height: 20px;
    stroke-width: 2;
  }

  .section-title:hover .section-icon {
    color: #2563eb;
    transform: scale(1.1);
    filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4));
  }

  .section-icon:empty {
    display: none;
  }

  .section-subtitle {
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }

  /* Conteúdo das seções */
  .section-content {
    min-height: 200px;
  }

  /* Grid dos simulados - layout compacto */
  .simulados-grid.compact {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: clamp(0.75rem, 1.5vw, 1rem);
    max-width: 100%;
  }

  .simulado-item {
    background: 
      linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    min-height: clamp(80px, 15vw, 100px);
  }

  .simulado-item.disponivel {
    border-color: rgba(34, 197, 94, 0.3);
    box-shadow: 
      0 4px 12px rgba(34, 197, 94, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .simulado-item.disponivel:hover {
    transform: translateY(-3px);
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 
      0 8px 16px rgba(34, 197, 94, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .simulado-item.indisponivel {
    opacity: 0.6;
    cursor: not-allowed;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .simulado-number {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .number-badge {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 800;
    color: var(--text-primary);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .simulado-status {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-text {
    font-size: clamp(0.7rem, 1.4vw, 0.8rem);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-text.disponivel {
    color: #22c55e;
  }

  .status-text.indisponivel {
    color: #ef4444;
  }

  /* Grid dos temas */
  .temas-grid {
    display: grid;
    gap: clamp(1rem, 2vw, 1.25rem);
    grid-template-columns: 1fr;
  }

  .tema-item {
    background: 
      linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    text-align: left;
  }

  .tema-item.disponivel {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 
      0 4px 12px rgba(99, 102, 241, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .tema-item.disponivel:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 
      0 8px 16px rgba(99, 102, 241, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .tema-item.indisponivel {
    opacity: 0.6;
    cursor: not-allowed;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .tema-content {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
  }

  .tema-title {
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .tema-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .tema-questoes {
    font-size: clamp(0.75rem, 1.5vw, 0.85rem);
    color: var(--text-muted);
    font-weight: 500;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-indicator.disponivel {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
  }

  .status-indicator.indisponivel {
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
  }

  /* Estados de loading e erro */
  .skeleton-grid {
    display: grid;
    gap: clamp(1rem, 2vw, 1.25rem);
  }

  .skeleton-grid .simulado-skeleton {
    height: clamp(80px, 15vw, 100px);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
  }

  .skeleton-grid .tema-skeleton {
    height: clamp(60px, 12vw, 80px);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
  }

  .error-state,
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    text-align: center;
    padding: clamp(1rem, 2vw, 1.5rem);
  }

  .error-state p.erro,
  .empty-state p.vazio {
    color: var(--text-muted);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    margin: 0;
  }

  /* Badges e estados */
  .badge {
    padding: clamp(0.3rem, 0.6vw, 0.4rem) clamp(0.6rem, 1.2vw, 0.8rem);
    border-radius: 999px;
    font-size: clamp(0.7rem, 1.4vw, 0.82rem);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .badge.sucesso {
    background: rgba(34, 197, 94, 0.2);
    color: #bbf7d0;
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
  }

  .badge.neutro {
    background: rgba(148, 163, 184, 0.2);
    color: var(--text-muted);
    border-color: rgba(148, 163, 184, 0.3);
  }

  .badge.erro {
    background: rgba(248, 113, 113, 0.2);
    color: #fecaca;
    border-color: rgba(248, 113, 113, 0.4);
    box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2);
  }

  .skeleton {
    height: clamp(120px, 20vw, 160px);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }

  .skeleton-grid.temas {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    grid-auto-rows: clamp(140px, 25vw, 200px);
  }

  .vazio {
    color: var(--text-muted);
    font-weight: 500;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    text-align: center;
    padding: clamp(1rem, 2vw, 1.5rem);
    background: rgba(15, 23, 42, 0.5);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .erro {
    color: #fecaca;
    background: rgba(248, 113, 113, 0.2);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    border: 1px solid rgba(248, 113, 113, 0.4);
    padding: clamp(0.75rem, 1.5vw, 1rem);
    margin-top: clamp(0.5rem, 1vw, 0.75rem);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2);
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Responsive Design */
  /* ==============================================
     RESPONSIVE DESIGN
  ============================================== */
  @media (max-width: 1200px) {
    .top-logo {
      margin-bottom: 0.75rem;
      padding: 0.5rem;
    }

    .top-logo img {
      width: clamp(45px, 7vw, 70px);
      height: clamp(45px, 7vw, 70px);
    }

    .top-logo span {
      font-size: clamp(0.8rem, 1.6vw, 1rem);
    }

    .performance-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .performance-main {
      order: 1;
    }

    .performance-stats {
      order: 2;
    }

    .progress-section {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }

    .progress-ring-container {
      flex-direction: row;
      align-items: center;
      gap: 2rem;
    }

    .performance-status {
      flex: 1;
    }

    /* New layout responsive */
    .performance-grid-new {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .performance-sidebar {
      flex-direction: row;
      gap: 2rem;
    }

    .insights-grid-vertical {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .actions-container {
      display: flex;
      gap: 1rem;
    }
  }

  @media (max-width: 900px) {
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .performance-dashboard {
      padding: clamp(1.5rem, 3vw, 2rem);
    }

    .progress-section {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .progress-ring-container {
      flex-direction: column;
      gap: 1.5rem;
    }

    .performance-actions {
      flex-direction: column;
    }

    .btn-primary.large, .btn-secondary.large {
      width: 100%;
      justify-content: center;
    }

    /* New horizontal layout responsive - tablet */
    .performance-grid-horizontal {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .performance-ring-section {
      justify-content: center;
    }

    .horizontal-stats-grid {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .stat-bullet {
      flex: 1;
      min-width: 140px;
    }

    .insights-grid-horizontal {
      flex-direction: column;
    }

    /* Old layout responsive - mobile */
    .small-stats-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      max-width: 300px;
    }

    .performance-sidebar {
      flex-direction: column;
    }

    .insights-grid-vertical {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .actions-container {
      flex-direction: column;
    }
  }

  @media (max-width: 600px) {
    .performance-dashboard {
      padding: 1.5rem 1rem;
      margin: 0 -1rem;
      border-radius: 0;
    }

    .dashboard-header {
      margin-bottom: 1.5rem;
    }

    .performance-grid {
      gap: 1.5rem;
    }

    .progress-ring {
      width: 160px;
      height: 160px;
    }

    .ring-percentage {
      font-size: 2.1rem;
    }

    .stats-grid {
      gap: 0.75rem;
    }

    .stat-item {
      padding: 1rem;
    }

    .insights-grid {
      gap: 0.75rem;
    }

    .insights-grid-horizontal {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    /* Mobile horizontal layout */
    .performance-grid-horizontal {
      grid-template-columns: 1fr;
      gap: 1rem;
      text-align: center;
    }

    .horizontal-stats-grid {
      flex-direction: column;
      gap: 0.75rem;
    }

    .stat-bullet {
      justify-content: center;
      text-align: center;
    }

    .insight-card {
      padding: 1rem;
    }

    .performance-actions {
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      flex: none;
      min-width: 120px;
    }
  }

  @media (max-width: 480px) {
    .header-content h2 {
      font-size: 1.5rem;
    }

    .progress-ring {
      width: 140px;
      height: 140px;
    }

    .ring-percentage {
      font-size: 1.8rem;
    }

    /* New layout responsive - very small screens */
    .small-stats-grid {
      max-width: 250px;
    }

    .small-stat-card {
      padding: 0.75rem;
    }

    .small-stat-number {
      font-size: 1rem;
    }

    .small-stat-label {
      font-size: 0.625rem;
    }

    .stat-number {
      font-size: 1.25rem;
    }

    .performance-actions {
      margin-top: 1.5rem;
    }

    .btn-primary.large, .btn-secondary.large {
      padding: 0.875rem 1.5rem;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 900px) {
    .hero-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1.5rem;
    }

    .hero-user {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .hero-actions {
      align-items: stretch;
      min-width: unset;
    }

    .action-buttons {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .hero-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .simulados-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .temas-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .container {
      padding: 1rem 0.75rem 3rem;
    }

    .hero-card {
      padding: 1.5rem 1rem;
    }

    .desempenho-horizontal-card {
      padding: 1.5rem 1rem;
    }

    .dashboard-header {
      text-align: center;
    }

    .ring-compact {
      margin: 0 auto;
    }

    .stat-card-horizontal {
      padding: 0.75rem;
    }

    .actions-horizontal {
      flex-direction: column;
    }

    .btn-primary, .btn-secondary {
      width: 100%;
      justify-content: center;
    }

    .hero-user {
      flex-direction: row;
      text-align: left;
      gap: 0.75rem;
    }

    .hero-badges {
      flex-direction: column;
      gap: 0.3rem;
    }

    .action-buttons {
      flex-direction: column;
      gap: 0.5rem;
    }

    .hero-stats {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .aproveitamento-hero {
      padding: 1.5rem 1rem;
    }

    .aproveitamento-stats {
      grid-template-columns: 1fr;
    }

    .aproveitamento-actions {
      flex-direction: column;
    }

    .dashboard-sections {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .simulados-grid.compact {
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    }
  }

  @media (max-width: 640px) {
    .dashboard-sections {
      gap: 1rem;
    }

    .section-card {
      padding: 1.25rem;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .simulados-grid.compact {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .simulado-item {
      min-height: 70px;
      padding: 0.75rem;
    }

    .number-badge {
      font-size: 1.25rem;
    }

    .tema-item {
      padding: 1rem;
    }

    .tema-title {
      font-size: 0.85rem;
    }

    .simulados-grid {
      grid-template-columns: 1fr;
    }

    .temas-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .hero-user {
      flex-direction: column;
      text-align: center;
    }

    .hero-brand span {
      display: none;
    }

    .stat-card {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
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
    .card:hover,
    .simulado-box:hover,
    .stat-card:hover,
    .aproveitamento-stat:hover,
    .side-card:hover,
    .timeline-item:hover,
    .hero-action:hover,
    .aproveitamento-actions button:hover {
      transform: none;
    }
  }
</style>
