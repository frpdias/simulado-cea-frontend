<script lang="ts">
  import { goto } from '$app/navigation';

  const logoUrl = '/FULLSTACK3.png';

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

      goto('/login');
      alert('Cadastro realizado com sucesso! Confira sua caixa de entrada.');
    } catch (err: any) {
      error = err.message || 'Erro ao criar conta';
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth auth--signup">
  <div class="auth-background">
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>
  </div>

  <aside class="auth__panel">
    <div class="panel-content">
      <div class="auth__brand">
        <div class="brand-logo">
          <img src={logoUrl} alt="FullStack Educacional" loading="lazy" />
          <div class="logo-glow"></div>
        </div>
        <div class="brand-text">
          <span>Simulado CEA</span>
          <small>ANBIMA Certificação</small>
        </div>
      </div>

      <div class="panel-hero">
        <h1>Seu próximo simulado começa aqui.</h1>
        <p>
          Crie sua conta para acessar simulados completos, acompanhar métricas de evolução e receber
          insights personalizados sobre os temas que exigem reforço.
        </p>

        <div class="benefits-grid">
          <div class="benefit-item">
            <div class="benefit-icon">🎯</div>
            <div class="benefit-content">
              <strong>Simulados Direcionados</strong>
              <span>Questões focadas nas suas dificuldades</span>
            </div>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon">📊</div>
            <div class="benefit-content">
              <strong>Dashboard Completo</strong>
              <span>Acompanhe seu progresso em tempo real</span>
            </div>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon">📱</div>
            <div class="benefit-content">
              <strong>Estude em Qualquer Lugar</strong>
              <span>Plataforma otimizada para mobile</span>
            </div>
          </div>
        </div>
      </div>

      <ul class="auth__highlights">
        <li>
          <div class="highlight-icon">✓</div>
          <span>Simulados ilimitados e atualizados</span>
        </li>
        <li>
          <div class="highlight-icon">✓</div>
          <span>Painel com indicadores de desempenho</span>
        </li>
        <li>
          <div class="highlight-icon">✓</div>
          <span>Ambiente preparado para mobile e desktop</span>
        </li>
      </ul>
    </div>
  </aside>

  <section class="auth__card">
    <div class="card-header">
      <div class="header-content">
        <h2>Criar uma nova conta</h2>
        <p>Preencha os dados abaixo para liberar o acesso à plataforma.</p>
      </div>
      <div class="header-decoration"></div>
    </div>

    {#if error}
      <div class="auth__alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>Erro no cadastro</strong>
          <span>{error}</span>
        </div>
      </div>
    {/if}

    <form class="auth__form" on:submit|preventDefault={cadastrar}>
      <div class="field-group">
        <label class="field">
          <span class="field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Nome completo
          </span>
          <div class="input-wrapper">
            <input
              id="nome"
              type="text"
              bind:value={nome}
              placeholder="Seu nome como deseja no certificado"
              autocomplete="name"
              required
            />
            <div class="input-focus-line"></div>
          </div>
        </label>

        <label class="field">
          <span class="field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            E-mail
          </span>
          <div class="input-wrapper">
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="seu@email.com"
              autocomplete="email"
              required
            />
            <div class="input-focus-line"></div>
          </div>
        </label>

        <label class="field">
          <span class="field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            WhatsApp
          </span>
          <div class="input-wrapper">
            <input
              id="whatsapp"
              type="tel"
              bind:value={whatsapp}
              placeholder="(11) 99999-9999"
              autocomplete="tel"
              required
            />
            <div class="input-focus-line"></div>
          </div>
        </label>

        <div class="password-grid">
          <label class="field">
            <span class="field-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Senha
            </span>
            <div class="input-wrapper">
              <input
                id="senha"
                type="password"
                bind:value={senha}
                placeholder="Mínimo 6 caracteres"
                minlength="6"
                autocomplete="new-password"
                required
              />
              <div class="input-focus-line"></div>
            </div>
          </label>

          <label class="field">
            <span class="field-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Confirmar senha
            </span>
            <div class="input-wrapper">
              <input
                id="confirmarSenha"
                type="password"
                bind:value={confirmarSenha}
                placeholder="Digite a senha novamente"
                minlength="6"
                autocomplete="new-password"
                required
              />
              <div class="input-focus-line"></div>
            </div>
          </label>
        </div>
      </div>

      <button type="submit" class="submit-button" disabled={loading}>
        {#if loading}
          <div class="loading-spinner"></div>
          <span>Criando conta...</span>
        {:else}
          <span>Finalizar cadastro</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        {/if}
      </button>
    </form>

    <footer class="auth-footer">
      <div class="footer-divider">
        <span>Já possui acesso?</span>
      </div>
      <a href="/login" class="login-link">
        <span>Entrar com minha conta</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </footer>
  </section>
</div>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  .auth {
    min-height: calc(100vh - 4rem);
    padding: clamp(1rem, 3vw, 2.5rem);
    display: grid;
    grid-template-columns: minmax(300px, 1fr) minmax(320px, 500px);
    gap: clamp(2rem, 5vw, 4rem);
    align-items: stretch;
    position: relative;
    background: 
      radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
      linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 1) 100%);
  }

  .auth-background {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .floating-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.6;
    animation: float 8s ease-in-out infinite;
  }

  .shape-1 {
    width: clamp(200px, 30vw, 400px);
    height: clamp(200px, 30vw, 400px);
    top: -10%;
    left: -10%;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.4), transparent 70%);
    animation-delay: 0s;
  }

  .shape-2 {
    width: clamp(150px, 25vw, 300px);
    height: clamp(150px, 25vw, 300px);
    bottom: -10%;
    right: -10%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%);
    animation-delay: -4s;
  }

  .shape-3 {
    width: clamp(100px, 20vw, 200px);
    height: clamp(100px, 20vw, 200px);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(14, 165, 233, 0.2), transparent 70%);
    animation-delay: -2s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    33% { transform: translateY(-15px) scale(1.05); }
    66% { transform: translateY(15px) scale(0.95); }
  }

  .auth__panel {
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.85);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    padding: clamp(1.5rem, 3vw, 2.6rem);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .panel-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2rem);
    height: 100%;
  }

  .auth__brand {
    display: inline-flex;
    align-items: center;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    background: 
      linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.25rem);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 10px 25px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(249, 115, 22, 0.2);
    max-width: fit-content;
  }

  .brand-logo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-logo img {
    width: clamp(90px, 12vw, 140px);
    height: clamp(90px, 12vw, 140px);
    object-fit: contain;
    filter: drop-shadow(0 12px 24px rgba(249, 115, 22, 0.6)) brightness(1.15) contrast(1.25);
    position: relative;
    z-index: 2;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    padding: 12px;
    transition: all 0.4s ease;
  }

  .logo-glow {
    position: absolute;
    inset: 0;
    background: rgba(249, 115, 22, 0.3);
    border-radius: 50%;
    animation: glow 3s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .brand-text span {
    font-size: clamp(0.9rem, 1.8vw, 1.1rem);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-primary);
    font-weight: 700;
    background: linear-gradient(135deg, #fff 0%, rgba(148, 163, 184, 0.9) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-text small {
    font-size: clamp(0.7rem, 1.4vw, 0.8rem);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  .panel-hero {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.5rem);
    flex: 1;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    line-height: 1.2;
    font-weight: 800;
    color: var(--text-primary);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .panel-hero p {
    margin: 0;
    color: var(--text-secondary);
    font-size: clamp(0.95rem, 1.8vw, 1.15rem);
    line-height: 1.7;
    max-width: 90%;
  }

  .benefits-grid {
    display: grid;
    gap: clamp(1rem, 2vw, 1.25rem);
    margin: clamp(1rem, 2vw, 1.5rem) 0;
  }

  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem);
    background: rgba(15, 23, 42, 0.7);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    border: 1px solid rgba(249, 115, 22, 0.2);
    transition: all 0.3s ease;
  }

  .benefit-item:hover {
    transform: translateY(-2px);
    border-color: rgba(249, 115, 22, 0.4);
    box-shadow: 0 8px 16px rgba(249, 115, 22, 0.2);
  }

  .benefit-icon {
    font-size: clamp(1.5rem, 3vw, 2rem);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    flex-shrink: 0;
  }

  .benefit-content {
    display: flex;
    flex-direction: column;
    gap: clamp(0.25rem, 0.5vw, 0.4rem);
    min-width: 0;
    flex: 1;
  }

  .benefit-content strong {
    color: var(--text-primary);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    font-weight: 600;
  }

  .benefit-content span {
    color: var(--text-muted);
    font-size: clamp(0.8rem, 1.6vw, 0.9rem);
    line-height: 1.4;
  }

  .auth__highlights {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: clamp(0.75rem, 1.5vw, 1rem);
  }

  .auth__highlights li {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    padding: clamp(0.75rem, 1.5vw, 1rem);
    border-radius: clamp(0.5rem, 1vw, 0.75rem);
    background: rgba(15, 23, 42, 0.8);
    color: var(--text-secondary);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    border: 1px solid rgba(34, 197, 94, 0.3);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(34, 197, 94, 0.1);
    transition: all 0.3s ease;
  }

  .auth__highlights li:hover {
    transform: translateY(-1px);
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 8px 16px rgba(34, 197, 94, 0.2);
  }

  .highlight-icon {
    width: clamp(20px, 3vw, 24px);
    height: clamp(20px, 3vw, 24px);
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: clamp(10px, 1.5vw, 12px);
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
  }

  .auth__card {
    background: 
      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: clamp(1rem, 2vw, 1.5rem);
    padding: clamp(1.5rem, 3vw, 2.5rem);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: clamp(1.25rem, 2.5vw, 1.5rem);
    max-width: 100%;
    width: 100%;
    justify-self: center;
    position: relative;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.25rem);
    position: relative;
  }

  .header-content h2 {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 1.8rem);
    font-weight: 700;
    color: var(--text-primary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .header-content p {
    margin: clamp(0.5rem, 1vw, 0.75rem) 0 0;
    color: var(--text-muted);
    line-height: 1.6;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
  }

  .header-decoration {
    height: 3px;
    background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
    border-radius: 2px;
    opacity: 0.8;
  }

  .auth__alert {
    background: 
      linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(248, 113, 113, 0.15) 100%);
    border: 1px solid rgba(248, 113, 113, 0.4);
    color: #fecaca;
    padding: clamp(1rem, 2vw, 1.25rem);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    display: flex;
    align-items: flex-start;
    gap: clamp(0.75rem, 1.5vw, 1rem);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
  }

  .alert-icon {
    font-size: clamp(1.2rem, 2.5vw, 1.5rem);
    flex-shrink: 0;
  }

  .alert-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  .alert-content strong {
    font-weight: 600;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
  }

  .alert-content span {
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    opacity: 0.9;
  }

  .auth__form {
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2rem);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: clamp(1.25rem, 2.5vw, 1.5rem);
  }

  .password-grid {
    display: grid;
    gap: clamp(1rem, 2vw, 1.25rem);
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    color: var(--text-secondary);
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  .field-label svg {
    color: #f97316;
    filter: drop-shadow(0 2px 4px rgba(249, 115, 22, 0.3));
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    padding: clamp(1rem, 2vw, 1.25rem) clamp(1rem, 2vw, 1.25rem);
    border-radius: clamp(0.75rem, 1.5vw, 1rem);
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: 
      linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    color: var(--text-primary);
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }

  input::placeholder {
    color: rgba(148, 163, 184, 0.6);
  }

  input:focus {
    outline: none;
    border-color: rgba(249, 115, 22, 0.6);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 0 0 3px rgba(249, 115, 22, 0.2),
      0 8px 16px rgba(249, 115, 22, 0.15);
    transform: translateY(-1px);
  }

  .input-focus-line {
    position: absolute;
    bottom: 0;
    left: 50%;
    right: 50%;
    height: 2px;
    background: linear-gradient(90deg, #f97316, #ea580c);
    border-radius: 1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
  }

  input:focus + .input-focus-line {
    left: 0;
    right: 0;
    opacity: 1;
  }

  .submit-button {
    margin-top: clamp(0.5rem, 1vw, 1rem);
    padding: clamp(1rem, 2vw, 1.25rem) clamp(1.5rem, 3vw, 2rem);
    border-radius: 999px;
    border: none;
    font-weight: 700;
    font-size: clamp(0.95rem, 1.9vw, 1.1rem);
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 20px 40px rgba(249, 115, 22, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    position: relative;
    overflow: hidden;
  }

  .submit-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
  }

  .submit-button:hover::before {
    left: 100%;
  }

  .submit-button:hover:enabled {
    transform: translateY(-3px);
    box-shadow: 
      0 25px 50px rgba(249, 115, 22, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .submit-button:disabled:hover {
    transform: none;
    box-shadow: 
      0 20px 40px rgba(249, 115, 22, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .loading-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .auth-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(1rem, 2vw, 1.25rem);
    padding-top: clamp(1rem, 2vw, 1.5rem);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer-divider {
    color: var(--text-muted);
    font-size: clamp(0.85rem, 1.7vw, 0.95rem);
    text-align: center;
  }

  .login-link {
    display: inline-flex;
    align-items: center;
    gap: clamp(0.5rem, 1vw, 0.75rem);
    color: var(--text-primary);
    font-weight: 600;
    text-decoration: none;
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1.25rem, 2.5vw, 1.5rem);
    border-radius: 999px;
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.3);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .login-link:hover {
    transform: translateY(-2px);
    background: rgba(249, 115, 22, 0.2);
    border-color: rgba(249, 115, 22, 0.5);
    box-shadow: 0 10px 25px rgba(249, 115, 22, 0.2);
    text-decoration: none;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .auth {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .auth__panel {
      order: 2;
    }

    .auth__card {
      order: 1;
      max-width: 600px;
      justify-self: center;
    }
  }

  @media (max-width: 768px) {
    .auth {
      padding: 1.5rem 1rem;
    }

    .benefits-grid {
      display: none;
    }

    .password-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .auth {
      padding: 1rem 0.75rem;
    }

    .auth__panel,
    .auth__card {
      padding: 1.5rem 1.25rem;
    }

    .auth__brand {
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }

    .brand-text {
      align-items: center;
    }

    .field-label svg {
      display: none;
    }

    .submit-button {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .auth__highlights li span {
      font-size: 0.8rem;
    }

    .auth__card {
      padding: 1.25rem 1rem;
    }

    .login-link {
      width: 100%;
      justify-content: center;
    }

    .benefit-item {
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
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
    .submit-button:hover,
    .login-link:hover,
    .benefit-item:hover,
    .auth__highlights li:hover {
      transform: none;
    }
  }
</style>
