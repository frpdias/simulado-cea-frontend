#!/usr/bin/env node
/**
 * Remove deploys antigos no Vercel mantendo os dois mais recentes.
 *
 * Obtém automaticamente o token do Vercel CLI ou usa variáveis de ambiente:
 *  - VERCEL_TOKEN (opcional, obtido automaticamente se não definido)
 *  - VERCEL_PROJECT_ID ou VERCEL_PROJECT_NAME (ao menos uma)
 *  - VERCEL_TEAM_ID (opcional, se o projeto estiver sob um time)
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';

/**
 * Obtém o token do Vercel automaticamente
 */
function getVercelToken() {
  // 1. Tentar usar a variável de ambiente primeiro
  const envToken = (process.env.VERCEL_TOKEN ?? '').trim();
  if (envToken) {
    console.log('🔑 Usando VERCEL_TOKEN da variável de ambiente');
    return envToken;
  }

  // 2. Tentar obter da sessão atual do Vercel CLI
  try {
    console.log('🔍 Tentando obter token da sessão do Vercel CLI...');
    
    // Tentar diferentes localizações do token
    const possiblePaths = [
      resolve(homedir(), 'Library', 'Application Support', 'com.vercel.cli', 'auth.json'),
      resolve(homedir(), '.vercel', 'auth.json'),
      resolve(homedir(), '.vercel', 'config.json'),
      resolve(homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json')
    ];

    for (const authPath of possiblePaths) {
      if (existsSync(authPath)) {
        try {
          const authData = JSON.parse(readFileSync(authPath, 'utf8'));
          if (authData.token) {
            console.log('🔑 Token encontrado em:', authPath);
            return authData.token;
          }
        } catch (err) {
          // Continuar tentando outros arquivos
        }
      }
    }

    // 3. Como último recurso, usar um token temporário via comando vercel
    console.log('� Gerando token temporário...');
    const tempToken = execSync('vercel whoami --token', { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    }).trim();
    
    if (tempToken && tempToken.startsWith('ver_')) {
      console.log('🔑 Token temporário gerado');
      return tempToken;
    }

  } catch (err) {
    console.warn('⚠️ Erro ao obter token:', err.message);
  }

  return null;
}

const REQUIRED_TOKEN = getVercelToken();

let projectIdEnv = (process.env.VERCEL_PROJECT_ID ?? '').trim();
let projectNameEnv = (process.env.VERCEL_PROJECT_NAME ?? '').trim();
let teamIdEnv = (process.env.VERCEL_ORG_ID ?? process.env.VERCEL_TEAM_ID ?? '').trim();

const projectConfigPath = resolve(process.cwd(), '.vercel/project.json');
let projectConfig = {};

if (existsSync(projectConfigPath)) {
	try {
		projectConfig = JSON.parse(readFileSync(projectConfigPath, 'utf8')) ?? {};
	} catch (err) {
		console.warn(
			'⚠️ Não foi possível ler .vercel/project.json:',
			err instanceof Error ? err.message : err
		);
	}
}

const PLACEHOLDER_REGEX = /<.*>/;

if (projectIdEnv && PLACEHOLDER_REGEX.test(projectIdEnv)) {
	projectIdEnv = '';
}

if (projectNameEnv && PLACEHOLDER_REGEX.test(projectNameEnv)) {
	projectNameEnv = '';
}

if (teamIdEnv && PLACEHOLDER_REGEX.test(teamIdEnv)) {
	teamIdEnv = '';
}

const PROJECT_ID = projectIdEnv || (projectConfig.projectId ?? '').trim();
const PROJECT_NAME = projectNameEnv || (projectConfig.projectName ?? '').trim();
const TEAM_ID = teamIdEnv || (projectConfig.orgId ?? '').trim();

if (!REQUIRED_TOKEN) {
	console.warn('⚠️ Token do Vercel não encontrado - pulando limpeza de deploys.');
	console.warn('💡 Para habilitar: vercel login ou defina VERCEL_TOKEN');
	process.exit(0); // Exit com sucesso para não bloquear o deploy
}

if (!PROJECT_ID && !PROJECT_NAME) {
	console.error('❌ Informe VERCEL_PROJECT_ID ou VERCEL_PROJECT_NAME para identificar o projeto.');
	process.exit(1);
}

const query = new URLSearchParams({
	limit: '100'
});

if (PROJECT_ID) {
	query.set('projectId', PROJECT_ID);
} else {
	query.set('project', PROJECT_NAME);
}

if (TEAM_ID) {
	query.set('teamId', TEAM_ID);
}

const headers = {
	Authorization: `Bearer ${REQUIRED_TOKEN}`,
	'Content-Type': 'application/json'
};

const API_BASE = 'https://api.vercel.com';

async function listarDeploys() {
	const response = await fetch(`${API_BASE}/v6/deployments?${query.toString()}`, { headers });
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Falha ao listar deploys (${response.status}): ${body}`);
}

	const payload = await response.json();
	const deployments = Array.isArray(payload?.deployments) ? payload.deployments : [];
	return deployments.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

async function excluirDeploy(id) {
	const deleteQuery = new URLSearchParams();
	if (TEAM_ID) {
		deleteQuery.set('teamId', TEAM_ID);
	}

	const response = await fetch(`${API_BASE}/v13/deployments/${id}?${deleteQuery.toString()}`, {
		method: 'DELETE',
		headers
	});

	if (response.status === 404) {
		console.warn(`⚠️ Deploy ${id} já inexistente.`);
		return;
	}

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Falha ao excluir deploy ${id} (${response.status}): ${body}`);
	}

	console.log(`🧹 Deploy ${id} removido.`);
}

async function main() {
	try {
		const deployments = await listarDeploys();

		if (deployments.length <= 2) {
			console.log('ℹ️ Apenas dois (ou menos) deploys encontrados. Nada a excluir.');
			return;
		}

		const preservados = deployments.slice(0, 2).map((deploy) => deploy.uid || deploy.id);
		console.log(`✅ Mantendo deploys: ${preservados.join(', ')}`);

		const antigos = deployments.slice(2);

		for (const deploy of antigos) {
			const id = deploy.uid || deploy.id;
			if (!id) continue;

			// Skip deployments that are not finished yet
			if (deploy.readyState && deploy.readyState !== 'READY' && deploy.readyState !== 'ERROR') {
				console.log(`⏭️ Ignorando deploy ${id} com estado ${deploy.readyState}.`);
				continue;
			}

			await excluirDeploy(id);
		}

		console.log('✨ Limpeza de deploys concluída.');
	} catch (error) {
		console.error('❌ Erro ao limpar deploys:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

await main();
