
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  interface Questao {
    id: number;
    tema: string | null;
    enunciado: string;
    alternativa_a: string | null;
    alternativa_b: string | null;
    alternativa_c: string | null;
    alternativa_d: string | null;
    resposta_correta: string | null;
    ha_imagem?: boolean | null;
    id_questao_origem?: string | null;
    url_imagem?: string | null;
    imagens?: string[];
    comentario: string | null;
  }

  interface QuestaoPreparada extends Questao {
    opcoes: { label: string; texto: string }[];
  }

  const DURACAO_PADRAO_SEGUNDOS = 4 * 60 * 60;

  let carregando = true;
  let erro = '';
  let numeroSimulado: number | null = null;
  let questoesBase: Questao[] = [];
  let questoes: QuestaoPreparada[] = [];
  let indiceAtual = 0;
  let respostas: Record<number, string> = {};
  let resultados: Record<number, 'correta' | 'incorreta'> = {};
  let provaIniciada = false;
  let provaEncerrada = false;
  let tempoRestante = DURACAO_PADRAO_SEGUNDOS;
  let intervalo: ReturnType<typeof setInterval> | null = null;
  let tempoGastoSegundos = 0;
  let envioEstado: 'idle' | 'enviando' | 'sucesso' | 'erro' = 'idle';
  let envioMensagem = '';
  let usuarioAtual: { id: string; email: string } | null = null;

  let acertosParciais = 0;

  export let data: PageData;
  const supabase = data.supabase;
  const STORAGE_BUCKET = 'questoes-images';

  $: pagina = $page;
  $: numeroSimulado = Number($page.params.numero);
  $: temaSelecionado = $page.url.searchParams.get('tema') || null;
  $: questaoAtual = questoes[indiceAtual] ?? null;
  $: respondidas = Object.keys(respostas).length;
  $: acertosParciais = Object.values(resultados).filter((valor) => valor === 'correta').length;
  $: percentualAtual = respondidas ? Math.round((acertosParciais / respondidas) * 100) : 0;
  $: percentualFinal = questoes.length ? Math.round((acertosParciais / questoes.length) * 100) : 0;

  onMount(async () => {
    if (!numeroSimulado || Number.isNaN(numeroSimulado)) {
      goto('/painel');
      return;
    }

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      goto('/login');
      return;
    }

    usuarioAtual = {
      id: session.user.id,
      email: session.user.email ?? ''
    };

    // Construir a query com filtro por tema se especificado
    let query = supabase
      .from('questoes')
      .select('id, tema, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, comentario, ha_imagem, id_questao_origem, url_imagem')
      .eq('simulado_numero', numeroSimulado);

    // Aplicar filtro por tema se especificado na URL
    if (temaSelecionado) {
      query = query.ilike('tema', temaSelecionado.trim());
    }

    const { data: questoesData, error } = await query.order('id', { ascending: true });

    if (error) {
      erro = error.message;
    } else {
      const lista = questoesData ?? [];
      questoesBase = await carregarImagensQuestoes(lista);
      resetarEstadoSimulado();
    }

    carregando = false;
  });

  onDestroy(() => {
    limparIntervalo();
  });

  function resetarEstadoSimulado() {
    questoes = prepararQuestoes(questoesBase);
    indiceAtual = 0;
    respostas = {};
    resultados = {};
    acertosParciais = 0;
    tempoRestante = DURACAO_PADRAO_SEGUNDOS;
    tempoGastoSegundos = 0;
    envioEstado = 'idle';
    envioMensagem = '';
    provaIniciada = false;
    provaEncerrada = false;
  }

  const DISPLAY_LETRAS = ['A', 'B', 'C', 'D'] as const;

  const LIMITE_LISTAGEM = 20;

  function gerarReferenciasPossiveis(base: string) {
    const limparColchetes = base.replace(/^[\[](.+)[\]]$/, '$1').trim();
    const referencias = new Set<string>();

    const candidatas = [base, limparColchetes, limparColchetes.replace(/[^0-9A-Za-z_-]+/g, ''), limparColchetes.replace(/\D+/g, '')]
      .map((valor) => valor.trim())
      .filter((valor) => valor.length > 0);

    for (const valor of candidatas) {
      referencias.add(valor);
    }

    return Array.from(referencias);
  }

  function formatarQuestaoComColunas(enunciado: string) {
    try {
      // Separar introdução das colunas
      const inicioColuna1 = enunciado.search(/●\s*COLUNA\s+1/i);
      if (inicioColuna1 === -1) {
        return { temAlternativas: false, textoCompleto: enunciado };
      }

      const introducao = enunciado.substring(0, inicioColuna1).trim();
      const parteColunas = enunciado.substring(inicioColuna1);

      // Separar coluna 1 e coluna 2
      const inicioColuna2 = parteColunas.search(/●\s*COLUNA\s+2/i);
      if (inicioColuna2 === -1) {
        return { temAlternativas: false, textoCompleto: enunciado };
      }

      const textoColuna1 = parteColunas.substring(0, inicioColuna2).trim();
      const restoTexto = parteColunas.substring(inicioColuna2);

      // Extrair itens da coluna 1
      const itensColuna1 = [];
      const matchesColuna1 = textoColuna1.matchAll(/\((\d+)\)\s*([^(]+?)(?=\(\d+\)|$)/g);
      for (const match of matchesColuna1) {
        itensColuna1.push(`(${match[1]}) ${match[2].trim()}`);
      }

      // Separar coluna 2 da conclusão
      const inicioConclusao = restoTexto.search(/A\s+ordem\s+correta/i);
      let textoColuna2 = '';
      let conclusao = '';

      if (inicioConclusao !== -1) {
        textoColuna2 = restoTexto.substring(0, inicioConclusao);
        conclusao = restoTexto.substring(inicioConclusao).trim();
      } else {
        textoColuna2 = restoTexto;
      }

      // Extrair itens da coluna 2
      const itensColuna2 = [];
      const matchesColuna2 = textoColuna2.matchAll(/\(\s*\)\s*([^(]+?)(?=\(\s*\)|$)/g);
      for (const match of matchesColuna2) {
        itensColuna2.push(`( ) ${match[1].trim()}`);
      }

      return {
        temAlternativas: true,
        tipoEspecial: 'colunas',
        introducao,
        coluna1: {
          titulo: '● COLUNA 1',
          itens: itensColuna1
        },
        coluna2: {
          titulo: '● COLUNA 2',
          itens: itensColuna2
        },
        conclusao: conclusao || ''
      };
    } catch (error) {
      return { temAlternativas: false, textoCompleto: enunciado };
    }
  }

  function formatarEnunciado(enunciado: string) {
    // Detectar se o enunciado tem colunas de correspondência
    const temColunas = /COLUNA\s+1/i.test(enunciado) && /COLUNA\s+2/i.test(enunciado);
    
    if (temColunas) {
      return formatarQuestaoComColunas(enunciado);
    }
    
    // Detectar se o enunciado tem alternativas numeradas (I, II, III, etc.)
    const temAlternativasRomanas = /\s+I\s+[–-]\s+.*?\s+II\s+[–-]/i.test(enunciado);
    
    if (!temAlternativasRomanas) {
      return {
        temAlternativas: false,
        textoCompleto: enunciado
      };
    }

    try {
      // Encontrar onde começam as alternativas (primeiro "I –")
      const indicePrimeiraAlternativa = enunciado.search(/\s+I\s+[–-]\s+/);
      if (indicePrimeiraAlternativa === -1) {
        return { temAlternativas: false, textoCompleto: enunciado };
      }

      // Separar introdução
      const introducao = enunciado.substring(0, indicePrimeiraAlternativa).trim();

      // Usar uma abordagem mais simples: dividir por números romanos primeiro
      const restoTexto = enunciado.substring(indicePrimeiraAlternativa);
      
      // Dividir por números romanos (I, II, III, IV, V, VI)
      const partes = restoTexto.split(/\s+(?=[IVX]{1,3}\s+[–-])/);
      
      const alternativas = [];
      let conclusao = '';

      for (let i = 0; i < partes.length; i++) {
        const parte = partes[i].trim();
        if (!parte) continue;

        // Verificar se esta parte contém um padrão de conclusão
        const padroesConclusao = [
          /^(.+?)\s+(Está\s+correto\s+o\s+que\s+se\s+aﬁrma\s+(?:APENAS\s+)?(?:apenas\s+)?em:?.*)$/i,
          /^(.+?)\s+(São\s+consideradas?\s+.*?)$/i
        ];

        let encontrouConclusao = false;
        for (const regex of padroesConclusao) {
          const match = parte.match(regex);
          if (match) {
            if (match[1].trim()) {
              alternativas.push(match[1].trim());
            }
            conclusao = match[2].trim();
            encontrouConclusao = true;
            break;
          }
        }

        if (!encontrouConclusao) {
          alternativas.push(parte);
        }
      }

      // Se não encontrou conclusão nas alternativas, procurar no final
      if (!conclusao && alternativas.length > 0) {
        const ultimaAlternativa = alternativas[alternativas.length - 1];
        const padroesConclusaoFinal = [
          /^(.+?)\s+(Está\s+correto\s+.*?)$/i,
          /^(.+?)\s+(São\s+consideradas?\s+.*?)$/i
        ];

        for (const regex of padroesConclusaoFinal) {
          const match = ultimaAlternativa.match(regex);
          if (match) {
            alternativas[alternativas.length - 1] = match[1].trim();
            conclusao = match[2].trim();
            break;
          }
        }
      }

      return {
        temAlternativas: true,
        introducao,
        alternativas: alternativas.filter(alt => alt.trim()),
        conclusao: conclusao || ''
      };
    } catch (error) {
      // Em caso de erro, retornar formato simples
      return {
        temAlternativas: false,
        textoCompleto: enunciado
      };
    }
  }

  async function carregarImagensQuestoes(lista: Questao[]) {
    if (!lista.length) return [] as Questao[];

    const storage = supabase.storage.from(STORAGE_BUCKET);
    const resultados: Questao[] = [];

    for (const questao of lista) {
      const imagens: string[] = [];

      if (questao.ha_imagem) {
        // Primeiro, tentar usar url_imagem se disponível
        if (questao.url_imagem && questao.url_imagem.trim()) {
          imagens.push(questao.url_imagem.trim());
        } else {
          // Fallback para o método antigo de buscar no storage
          const referenciaBruta = (questao.id_questao_origem ?? questao.id?.toString() ?? '')
            .toString()
            .trim();

          const referencias = referenciaBruta ? gerarReferenciasPossiveis(referenciaBruta) : [];

          for (const referencia of referencias) {
            if (!referencia) continue;

            const adicionarPublicUrl = (caminho: string) => {
              const { data } = storage.getPublicUrl(caminho);
              if (data?.publicUrl && !imagens.includes(data.publicUrl)) {
                imagens.push(data.publicUrl);
              }
            };

            const { data: arquivosDiretorio } = await storage.list(referencia, { limit: LIMITE_LISTAGEM });
            if (arquivosDiretorio && arquivosDiretorio.length > 0) {
              for (const arquivo of arquivosDiretorio) {
                if (arquivo.name.endsWith('/')) continue;
                adicionarPublicUrl(`${referencia}/${arquivo.name}`);
              }
            }

            if (imagens.length === 0) {
              const { data: arquivosRaiz } = await storage.list('', {
                limit: LIMITE_LISTAGEM,
                search: referencia
              });

              if (arquivosRaiz && arquivosRaiz.length > 0) {
                for (const arquivo of arquivosRaiz) {
                  if (!arquivo.name.toLowerCase().includes(referencia.toLowerCase())) continue;
                  adicionarPublicUrl(arquivo.name);
                }
              }
            }

            if (imagens.length > 0) {
              break;
            }
          }
        }
      }

      resultados.push({ ...questao, imagens });
    }

    return resultados;
  }

  function prepararQuestoes(lista: Questao[]): QuestaoPreparada[] {
    return lista.map((questao) => {
      const alternativas = [
        { label: 'A', texto: questao.alternativa_a },
        { label: 'B', texto: questao.alternativa_b },
        { label: 'C', texto: questao.alternativa_c },
        { label: 'D', texto: questao.alternativa_d }
      ]
        .filter((op) => op.texto && op.texto.trim().length > 0)
        .map((op) => ({ label: op.label, texto: op.texto!.trim() }));

      const embaralhadas = embaralhar(alternativas);

      const corretaOriginal = (questao.resposta_correta ?? '').trim().toUpperCase();
      let novaCorreta = corretaOriginal;

      const opcoes = embaralhadas.map((opcao, index) => {
        const label = DISPLAY_LETRAS[index] ?? opcao.label;
        if (opcao.label === corretaOriginal) {
          novaCorreta = label;
        }
        return {
          label,
          texto: opcao.texto
        };
      });

      return {
        ...questao,
        resposta_correta: novaCorreta,
        opcoes,
        imagens: questao.imagens ?? []
      };
    });
  }

  function embaralhar<T>(entrada: T[]): T[] {
    const array = [...entrada];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function formatarTempo(segundos: number) {
    const h = Math.floor(segundos / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((segundos % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(segundos % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function limparIntervalo() {
    if (intervalo) {
      clearInterval(intervalo);
      intervalo = null;
    }
  }

  function iniciarProva() {
    if (questoes.length === 0 || provaIniciada) return;
    questoes = prepararQuestoes(questoesBase);
    respostas = {};
    resultados = {};
    indiceAtual = 0;
    provaIniciada = true;
    provaEncerrada = false;
    tempoRestante = DURACAO_PADRAO_SEGUNDOS;
    tempoGastoSegundos = 0;
    envioEstado = 'idle';
    envioMensagem = '';
    limparIntervalo();
    intervalo = setInterval(() => {
      tempoRestante = Math.max(tempoRestante - 1, 0);
      if (tempoRestante === 0) {
        encerrarProva(true);
      }
    }, 1000);
  }

  function selecionarResposta(questaoId: number, alternativa: string) {
    if (!provaIniciada || provaEncerrada) return;
    if (respostas[questaoId]) return;

    const questao = questoes.find((q) => q.id === questaoId);
    if (!questao) return;

    const correta =
      (questao.resposta_correta ?? '').trim().toUpperCase() === alternativa.trim().toUpperCase();

    respostas = { ...respostas, [questaoId]: alternativa };
    resultados = {
      ...resultados,
      [questaoId]: correta ? 'correta' : 'incorreta'
    };
  }

  function irParaQuestao(indice: number) {
    if (indice < 0 || indice >= questoes.length) return;
    indiceAtual = indice;
  }

  async function encerrarProva(forcado = false) {
    if (!provaIniciada || provaEncerrada) return;
    limparIntervalo();

    tempoGastoSegundos = DURACAO_PADRAO_SEGUNDOS - tempoRestante;
    provaEncerrada = true;
    provaIniciada = false;

    const acertosTotais = acertosParciais;

    await enviarResultado(acertosTotais, forcado);
  }

  async function enviarResultado(acertosTotais: number, forcado = false) {
    if (!usuarioAtual || envioEstado === 'enviando') return;
    envioEstado = 'enviando';
    envioMensagem = '';

    try {
      const tokenResponse = await supabase.auth.getSession();
      const accessToken = tokenResponse.data.session?.access_token;

      if (!accessToken) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const resposta = await fetch('/api/simulados/submeter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          simuladoNumero: numeroSimulado,
          respostas,
          acertos: acertosTotais,
          total: questoes.length,
          tempoGastoSegundos,
          finalizadoAutomaticamente: forcado
        })
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.success) {
        throw new Error(resultado.error ?? 'Não foi possível registrar o resultado.');
      }

      envioEstado = 'sucesso';
      envioMensagem = 'Resultado registrado com sucesso!';
    } catch (err: any) {
      envioEstado = 'erro';
      envioMensagem = err?.message ?? 'Erro ao registrar resultado.';
    }
  }

  function novaTentativa() {
    limparIntervalo();
    resetarEstadoSimulado();
  }

  function voltarAoPainel() {
    goto('/painel');
  }
</script>


<svelte:head>
  <title>Simulado Nº {numeroSimulado} | Simulado CEA</title>
</svelte:head>

<div class="container">
  <header class="topo">
    <div>
      <button class="botao-voltar" on:click={voltarAoPainel}>← Painel</button>
      <div class="cabecalho">
        <h1>Simulado Nº {numeroSimulado}</h1>
        {#if temaSelecionado}
          <div class="filtro-tema">
            <span class="filtro-icone">🔍</span>
            <span class="filtro-texto">Filtrando por: <strong>{decodeURIComponent(temaSelecionado)}</strong></span>
          </div>
        {/if}
      </div>
      <p>
        Revise as questões e selecione a alternativa correta. O cronômetro regressivo de 04:00:00
        inicia ao clicar em “Iniciar simulado”.
      </p>
    </div>
  </header>

  {#if carregando}
    <div class="skeleton-grid">
      {#each Array(4) as _, index}
        <div class="skeleton" aria-hidden="true"></div>
      {/each}
    </div>
  {:else if erro}
    <div class="erro">
      <p>Não foi possível carregar as questões: {erro}</p>
    </div>
  {:else if questoes.length === 0}
    <div class="vazio">
      <p>Nenhuma questão cadastrada para este simulado ainda.</p>
    </div>
  {:else if questaoAtual}
    <section class="simulado-meta">
      <div class="meta-esquerda">
        <div class="meta-bloco">
          <span class="meta-label">Questão atual</span>
          <strong>{indiceAtual + 1}<small>/{questoes.length}</small></strong>
        </div>
        <div class="meta-bloco">
          <span class="meta-label">% de acerto</span>
          <strong>{respondidas ? percentualAtual : 0}%</strong>
        </div>
        <div class="meta-bloco">
          <span class="meta-label">Respondidas</span>
          <strong>{respondidas}</strong>
        </div>
      </div>
      <div class="meta-direita">
        <div class="meta-bloco timer">
          <span class="meta-label">Tempo restante</span>
          <strong class:critico={tempoRestante <= 300}>{formatarTempo(tempoRestante)}</strong>
        </div>
        <div class="meta-acoes">
          {#if !provaIniciada}
            <button class="botao-primario" on:click={iniciarProva} disabled={questoes.length === 0}>
              Iniciar simulado
            </button>
          {:else if provaEncerrada}
            <button class="botao-primario" on:click={novaTentativa}>Nova tentativa</button>
          {:else}
            <button class="botao-secundario" on:click={() => encerrarProva(false)}>
              Finalizar agora
            </button>
          {/if}
        </div>
      </div>
    </section>

    <section class="questoes-mapa">
      <div class="questoes-legenda">
        <strong>Mapa de questões</strong>
        <span>
          {acertosParciais} acertos • {respondidas} respondidas de {questoes.length}
        </span>
      </div>
      <nav class="questoes-navegador" aria-label="Progresso das questões">
        {#each questoes as questaoNav, idx}
          <button
            type="button"
            class:current={indiceAtual === idx}
            class:correta={resultados[questaoNav.id] === 'correta'}
            class:incorreta={resultados[questaoNav.id] === 'incorreta'}
            on:click={() => irParaQuestao(idx)}
          >
            {idx + 1}
          </button>
        {/each}
      </nav>
    </section>

    <section class="questao-stage">
      <article class="questao-card">
        <header class="questao-header">
          <span class="questao-indice">Questão {indiceAtual + 1}</span>
          {#if questaoAtual.tema}
            <span class="questao-tema">{questaoAtual.tema}</span>
          {/if}
        </header>

        {#if formatarEnunciado(questaoAtual.enunciado).temAlternativas}
          {@const enunciadoFormatado = formatarEnunciado(questaoAtual.enunciado)}
          {#if enunciadoFormatado.tipoEspecial === 'colunas'}
            <div class="questao-enunciado-colunas">
              <p class="questao-introducao">{enunciadoFormatado.introducao}</p>
              
              <div class="colunas-container">
                <div class="coluna">
                  <h4>{enunciadoFormatado.coluna1.titulo}</h4>
                  <ul class="coluna-lista">
                    {#each enunciadoFormatado.coluna1.itens as item}
                      <li>{item}</li>
                    {/each}
                  </ul>
                </div>
                
                <div class="coluna">
                  <h4>{enunciadoFormatado.coluna2.titulo}</h4>
                  <ul class="coluna-lista">
                    {#each enunciadoFormatado.coluna2.itens as item}
                      <li>{item}</li>
                    {/each}
                  </ul>
                </div>
              </div>
              
              {#if enunciadoFormatado.conclusao}
                <p class="questao-conclusao">{enunciadoFormatado.conclusao}</p>
              {/if}
            </div>
          {:else}
            <div class="questao-enunciado-estruturado">
              <p class="questao-introducao">{enunciadoFormatado.introducao}</p>
              <ul class="questao-alternativas-enunciado">
                {#each enunciadoFormatado.alternativas as alternativa}
                  <li>{alternativa}</li>
                {/each}
              </ul>
              {#if enunciadoFormatado.conclusao}
                <p class="questao-conclusao">{enunciadoFormatado.conclusao}</p>
              {/if}
            </div>
          {/if}
        {:else}
          <p class="questao-enunciado">{questaoAtual.enunciado}</p>
        {/if}

        {#if questaoAtual.imagens && questaoAtual.imagens.length}
          <div class="questao-imagens">
            {#each questaoAtual.imagens as imagem, idx}
              <div class="questao-imagem-container">
                <img
                  class="questao-imagem"
                  src={imagem}
                  alt={`Imagem ${idx + 1} da questão ${questaoAtual.id}`}
                  loading="lazy"
                />
              </div>
            {/each}
          </div>
        {/if}

        <ul class="questao-opcoes">
          {#each questaoAtual.opcoes as opcao}
            <li>
              <button
                type="button"
                class:selected={respostas[questaoAtual.id] === opcao.label}
                class:correta={resultados[questaoAtual.id] === 'correta' && opcao.label === questaoAtual.resposta_correta}
                class:incorreta={resultados[questaoAtual.id] === 'incorreta' && respostas[questaoAtual.id] === opcao.label}
                class:mostra-correta={!!(resultados[questaoAtual.id] === 'incorreta' && opcao.label === questaoAtual.resposta_correta)}
                disabled={!provaIniciada || provaEncerrada || !!resultados[questaoAtual.id]}
                on:click={() => selecionarResposta(questaoAtual.id, opcao.label)}
              >
                <span class="letra">{opcao.label}</span>
                <span>{opcao.texto}</span>
              </button>
            </li>
          {/each}
        </ul>

        {#if resultados[questaoAtual.id] === 'correta'}
          <div class="questao-feedback sucesso">Boa! Você acertou esta questão.</div>
        {:else if resultados[questaoAtual.id] === 'incorreta'}
          <div class="questao-feedback alerta">
            Você marcou {respostas[questaoAtual.id]} e a alternativa correta é
            <strong>{questaoAtual.resposta_correta}</strong>.
          </div>
        {:else if !provaIniciada}
          <div class="questao-feedback neutro">Clique em “Iniciar simulado” para responder.</div>
        {/if}

        <div class="stage-controls">
          <div class="stage-controls-left">
            <button type="button" on:click={() => irParaQuestao(Math.max(indiceAtual - 1, 0))} disabled={indiceAtual === 0}>
              ← Anterior
            </button>
          </div>
          <div class="stage-controls-right">
            <button
              type="button"
              on:click={() => irParaQuestao(Math.min(indiceAtual + 1, questoes.length - 1))}
              disabled={indiceAtual === questoes.length - 1}
            >
              Próxima →
            </button>
            <button
              type="button"
              class="finalizar"
              on:click={() => encerrarProva(false)}
              disabled={!provaIniciada || provaEncerrada}
            >
              Finalizar simulado
            </button>
          </div>
        </div>
      </article>

      <aside class="questao-side">
        <div class="side-card summary">
          <h4>Resumo rápido</h4>
          <div class="timeline-item">
            <span class="indicador ganho"></span>
            <div class="timeline-copy">
              <strong>{acertosParciais}</strong>
              <small>acertos registrados</small>
            </div>
          </div>
          <div class="timeline-item">
            <span class="indicador neutro"></span>
            <div class="timeline-copy">
              <strong>{respondidas}</strong>
              <small>questões respondidas</small>
            </div>
          </div>
          <div class="timeline-item">
            <span class="indicador alerta"></span>
            <div class="timeline-copy">
              <strong>{questoes.length - respondidas}</strong>
              <small>questões pendentes</small>
            </div>
          </div>
        </div>

        {#if provaEncerrada}
          <div class="side-card destaque positivo">
            <div class="side-card-head">
              <span>Simulado concluído</span>
              <strong>{acertosParciais} de {questoes.length} ({percentualFinal}%)</strong>
            </div>
            <button class="botao-secundario" type="button" on:click={novaTentativa}>Reiniciar simulado</button>
            {#if envioEstado === 'sucesso'}
              <span class="badge sucesso pequeno">{envioMensagem}</span>
            {:else if envioEstado === 'erro'}
              <span class="badge erro pequeno">{envioMensagem}</span>
            {:else if envioEstado === 'enviando'}
              <span class="badge neutro pequeno">Registrando resultado...</span>
            {/if}
          </div>
        {/if}
      </aside>
    </section>
  {/if}
</div>


<style>
  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem clamp(1.2rem, 4vw, 2.4rem) 4rem;
  }

  .topo {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: clamp(1.75rem, 3vw, 2.5rem);
  }

  .botao-voltar {
    border: none;
    background: transparent;
    color: #6366f1;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 0.25rem;
  }

  .botao-voltar:hover {
    text-decoration: underline;
  }

  .cabecalho {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  .filtro-tema {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    font-size: 0.875rem;
    color: #e2e8f0;
  }

  .filtro-icone {
    font-size: 1rem;
  }

  .filtro-texto strong {
    color: #6366f1;
    font-weight: 600;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    color: #111827;
  }

  .botao-primario,
  .botao-secundario {
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.6rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .botao-primario {
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
    color: #fff;
  }

  .botao-secundario {
    background: rgba(99, 102, 241, 0.12);
    color: #4338ca;
  }

  .botao-primario:hover,
  .botao-secundario:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
  }

  .simulado-meta {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: clamp(1rem, 2.5vw, 1.8rem);
    padding: 1.35rem 1.6rem;
    background: rgba(15, 23, 42, 0.9);
    border-radius: 22px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
    margin-bottom: 1.5rem;
    align-items: center;
  }

  .meta-esquerda,
  .meta-direita {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .meta-bloco {
    min-width: 140px;
    padding: 0.85rem 1.1rem;
    border-radius: 16px;
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.12);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .meta-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(148, 163, 184, 0.75);
    font-weight: 600;
  }

  .meta-bloco strong {
    font-size: 1.5rem;
    color: #f8fafc;
    font-weight: 600;
  }

  .meta-bloco strong small {
    color: rgba(148, 163, 184, 0.65);
    font-size: 0.75rem;
    margin-left: 0.25rem;
  }

  .meta-bloco span:last-child:not(.meta-label) {
    color: rgba(148, 163, 184, 0.75);
    font-size: 0.85rem;
  }

  .meta-acoes {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .questoes-mapa {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .questoes-navegador {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(42px, 1fr));
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 18px;
    padding: 0.65rem;
  }

  .questoes-legenda {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    color: rgba(226, 232, 240, 0.75);
    font-size: 0.9rem;
  }

  .questoes-legenda strong {
    font-size: 0.95rem;
    color: #e2e8f0;
  }

  .questoes-navegador button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    min-height: 42px;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: rgba(15, 23, 42, 0.85);
    color: rgba(226, 232, 240, 0.75);
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: transform 0.18s ease, border 0.18s ease, background 0.18s ease;
  }

  .questoes-navegador button:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.45);
  }

  .questoes-navegador button.current {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(59, 130, 246, 0.35));
    color: #f8fafc;
    border-color: rgba(99, 102, 241, 0.45);
  }

  .questoes-navegador button.correta {
    background: rgba(34, 197, 94, 0.22);
    color: #bbf7d0;
    border-color: rgba(34, 197, 94, 0.45);
  }

  .questoes-navegador button.incorreta {
    background: rgba(248, 113, 113, 0.22);
    color: #fecaca;
    border-color: rgba(248, 113, 113, 0.4);
  }

  .questao-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: clamp(1.4rem, 3vw, 2.2rem);
    align-items: start;
  }

  .questao-card {
    background: radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.22), transparent 65%),
      rgba(15, 23, 42, 0.92);
    border-radius: 28px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    box-shadow: var(--shadow-md);
    padding: clamp(1.6rem, 3vw, 2.4rem);
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .questao-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .questao-indice {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(226, 232, 240, 0.7);
    font-weight: 600;
  }

  .questao-tema {
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.2);
    color: #bfdbfe;
    font-weight: 600;
  }

  .questao-enunciado {
    color: rgba(226, 232, 240, 0.9);
    line-height: 1.7;
    font-size: 1.05rem;
  }

  .questao-enunciado-estruturado {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .questao-introducao {
    color: rgba(226, 232, 240, 0.9);
    line-height: 1.7;
    font-size: 1.05rem;
    margin: 0;
  }

  .questao-alternativas-enunciado {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 12px;
    padding: 1.2rem;
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  .questao-alternativas-enunciado li {
    color: rgba(226, 232, 240, 0.85);
    line-height: 1.6;
    font-size: 1rem;
    padding-left: 0;
    position: relative;
  }

  .questao-conclusao {
    color: rgba(226, 232, 240, 0.9);
    line-height: 1.7;
    font-size: 1.05rem;
    margin: 0;
    font-weight: 600;
  }

  .questao-enunciado-colunas {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .colunas-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  .coluna h4 {
    color: rgba(226, 232, 240, 0.9);
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }

  .coluna-lista {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .coluna-lista li {
    color: rgba(226, 232, 240, 0.85);
    line-height: 1.6;
    font-size: 1rem;
    padding: 0.5rem 0;
  }

  @media (max-width: 768px) {
    .colunas-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .questao-imagens {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin: 0.85rem 0 0.25rem;
  }

  .questao-imagem-container {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
    background: rgba(15, 23, 42, 0.6);
    cursor: zoom-in;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .questao-imagem-container:hover {
    transform: scale(1.05);
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.5);
    z-index: 10;
    position: relative;
  }

  .questao-imagem {
    max-width: 100%;
    display: block;
    transition: transform 0.3s ease;
  }

  .questao-imagem-container:hover .questao-imagem {
    transform: scale(1.1);
  }

  .questao-opcoes {
    display: grid;
    gap: 0.85rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .questao-opcoes button {
    display: flex;
    gap: 0.9rem;
    align-items: flex-start;
    width: 100%;
    padding: 0.95rem 1.15rem;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    background: rgba(15, 23, 42, 0.88);
    color: rgba(226, 232, 240, 0.85);
    text-align: left;
    cursor: pointer;
    transition: border 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  }

  .questao-opcoes button:not(:disabled):hover {
    border-color: rgba(99, 102, 241, 0.55);
    box-shadow: 0 14px 28px rgba(99, 102, 241, 0.18);
    transform: translateY(-1px);
  }

  .questao-opcoes button:disabled {
    cursor: not-allowed;
  }

  .questao-opcoes button.selected {
    border-color: rgba(99, 102, 241, 0.7);
    background: rgba(99, 102, 241, 0.18);
  }

  .questao-opcoes button.correta,
  .questao-opcoes button.mostra-correta {
    border-color: rgba(34, 197, 94, 0.75);
    background: rgba(34, 197, 94, 0.18);
    color: #bbf7d0;
  }

  .questao-opcoes button.incorreta {
    border-color: rgba(239, 68, 68, 0.7);
    background: rgba(248, 113, 113, 0.16);
    color: #fecaca;
  }

  .letra {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.25);
    color: #e0e7ff;
    font-weight: 700;
    flex-shrink: 0;
  }

  .questao-feedback {
    border-radius: 14px;
    padding: 0.9rem 1rem;
    font-size: 0.95rem;
  }

  .questao-feedback.sucesso {
    background: rgba(34, 197, 94, 0.18);
    color: #bbf7d0;
    border: 1px solid rgba(34, 197, 94, 0.35);
  }

  .questao-feedback.alerta {
    background: rgba(248, 113, 113, 0.18);
    color: #fecaca;
    border: 1px solid rgba(248, 113, 113, 0.35);
  }

  .questao-feedback.neutro {
    background: rgba(99, 102, 241, 0.12);
    color: rgba(226, 232, 240, 0.7);
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .stage-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .stage-controls-left,
  .stage-controls-right {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .stage-controls button {
    border: none;
    border-radius: 999px;
    padding: 0.65rem 1.3rem;
    font-weight: 600;
    cursor: pointer;
    background: rgba(148, 163, 184, 0.15);
    color: rgba(226, 232, 240, 0.85);
    transition: filter 0.18s ease, transform 0.18s ease;
  }

  .stage-controls button:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .stage-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .stage-controls .finalizar {
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.65), rgba(56, 189, 248, 0.6));
    color: #0f172a;
  }

  .questao-side {
    display: grid;
    gap: 1rem;
  }

  .side-card {
    background: rgba(15, 23, 42, 0.9);
    border-radius: 24px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: var(--shadow-md);
    padding: 1.25rem 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .side-card h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary);
  }

  .timeline-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem 0.9rem;
    border-radius: 16px;
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.25);
    color: var(--text-secondary);
  }

  .indicador {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  .indicador.ganho { background: #22c55e; }
  .indicador.neutro { background: #38bdf8; }
  .indicador.alerta { background: #f97316; }

  .timeline-copy {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .timeline-copy strong {
    font-size: 1.1rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .timeline-copy small {
    font-size: 0.9rem;
    color: rgba(148, 163, 184, 0.7);
  }

  .side-card.destaque {
    border: 1px solid rgba(99, 102, 241, 0.32);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.18);
  }

  .side-card.destaque strong {
    color: var(--text-primary);
  }

  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .skeleton {
    height: 220px;
    border-radius: 18px;
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .erro,
  .vazio {
    padding: 2rem;
    border-radius: 16px;
    background: #fef2f2;
    color: #b91c1c;
  }

  @media (max-width: 960px) {
    .simulado-meta {
      grid-template-columns: 1fr;
    }

    .questao-stage {
      grid-template-columns: 1fr;
    }

    .questao-side {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .meta-esquerda,
    .meta-direita {
      justify-content: space-between;
    }

    .questoes-navegador {
      grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
    }

    .side-card {
      padding: 1.4rem;
    }
  }
</style>
