#!/usr/bin/env node

/**
 * 🩺 Script de Verificação de Saúde do Projeto
 * Verifica se todas as funcionalidades estão operacionais após o deploy
 */

const PROJECT_URL = 'https://simulado-cea.vercel.app';

const ENDPOINTS_TO_TEST = [
  '/',
  '/login',
  '/cadastro', 
  '/admin-login',
  '/painel',
  '/admin'
];

async function checkEndpoint(path) {
  const url = PROJECT_URL + path;
  try {
    const response = await fetch(url);
    const status = response.status;
    const statusText = response.statusText;
    
    let emoji = '✅';
    if (status >= 400) {
      emoji = '❌';
    } else if (status >= 300) {
      emoji = '⚠️';
    }
    
    console.log(`${emoji} ${path.padEnd(15)} → ${status} ${statusText}`);
    return { path, status, ok: response.ok };
  } catch (error) {
    console.log(`❌ ${path.padEnd(15)} → Error: ${error.message}`);
    return { path, status: 0, ok: false, error: error.message };
  }
}

async function healthCheck() {
  console.log('🩺 Verificação de Saúde do Projeto');
  console.log('🌐 URL:', PROJECT_URL);
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('─'.repeat(50));
  
  const results = [];
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('─'.repeat(50));
  
  const successful = results.filter(r => r.ok).length;
  const total = results.length;
  
  console.log(`📊 Resultado: ${successful}/${total} endpoints funcionando`);
  
  if (successful === total) {
    console.log('🎉 Todos os endpoints estão funcionando!');
  } else {
    console.log('⚠️  Alguns endpoints podem precisar de atenção');
  }
  
  console.log('─'.repeat(50));
  console.log('✅ Verificação concluída');
}

// Executar verificação
healthCheck().catch(console.error);