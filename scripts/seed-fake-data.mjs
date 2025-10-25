#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
	const envPath = resolve(process.cwd(), '.env');
	if (!existsSync(envPath)) {
		return;
	}

	const content = readFileSync(envPath, 'utf8');
	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const eqIndex = line.indexOf('=');
		if (eqIndex === -1) continue;
		const key = line.slice(0, eqIndex).trim();
		const value = line.slice(eqIndex + 1).trim();
		if (key && !(key in process.env)) {
			process.env[key] = value;
		}
	}
}

loadEnvFile();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '').trim();

if (!supabaseUrl) {
	console.error('❌ Defina VITE_SUPABASE_URL no .env antes de executar este script.');
	process.exit(1);
}

if (!serviceKey) {
	console.error('❌ Defina SUPABASE_SERVICE_ROLE_KEY (chave service role) no .env antes de executar este script.');
	process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
	auth: {
		persistSession: false
	}
});

const TEST_USER = {
	email: 'aluno.teste@simuladoc.com',
	password: 'TestePainel123',
	nome: 'Aluno Painel Teste',
	whatsapp: '+55 11 98888-0000',
	status: 'ativo'
};

const QUESTOES = [
	{
		id: 9001,
		simulado_numero: 1,
		tema: 'Mercado de Capitais',
		enunciado: 'Qual instrumento é utilizado para negociar ações na bolsa?',
		alternativa_a: 'Debêntures',
		alternativa_b: 'Fundos DI',
		alternativa_c: 'Home broker',
		alternativa_d: 'Tesouro Direto',
		resposta_correta: 'C',
		comentario: 'O home broker é a plataforma para negociação de ações em bolsa.'
	},
	{
		id: 9002,
		simulado_numero: 1,
		tema: 'Mercado de Capitais',
		enunciado: 'Qual órgão regula o mercado de capitais no Brasil?',
		alternativa_a: 'SUSEP',
		alternativa_b: 'CVM',
		alternativa_c: 'FEBRABAN',
		alternativa_d: 'BCB',
		resposta_correta: 'B',
		comentario: 'A CVM é a responsável por regular o mercado de capitais.'
	},
	{
		id: 9003,
		simulado_numero: 1,
		tema: 'Fundos de Investimento',
		enunciado: 'O que representa a cota de um fundo de investimento?',
		alternativa_a: 'Parte do patrimônio líquido do fundo',
		alternativa_b: 'Valor fixo determinado pela CVM',
		alternativa_c: 'Garantia de rentabilidade mínima',
		alternativa_d: 'Lucro operacional do gestor',
		resposta_correta: 'A',
		comentario: 'Cada cota representa a fração do patrimônio líquido do fundo.'
	},
	{
		id: 9011,
		simulado_numero: 2,
		tema: 'Derivativos',
		enunciado: 'Qual é o objetivo principal do uso de derivativos?',
		alternativa_a: 'Garantir lucro',
		alternativa_b: 'Diversificar impostos',
		alternativa_c: 'Reduzir riscos ou alavancar posições',
		alternativa_d: 'Determinar preços de commodities',
		resposta_correta: 'C',
		comentario: 'Derivativos são utilizados para proteção ou alavancagem.'
	},
	{
		id: 9012,
		simulado_numero: 2,
		tema: 'Ética',
		enunciado: 'Qual princípio reforça a importância da transparência na relação com o cliente?',
		alternativa_a: 'Princípio da liquidez',
		alternativa_b: 'Princípio da adequação',
		alternativa_c: 'Princípio da transparência',
		alternativa_d: 'Princípio do risco-retorno',
		resposta_correta: 'C',
		comentario: 'Transparência garante que o cliente receba informações claras.'
	},
	{
		id: 9013,
		simulado_numero: 2,
		tema: 'Planejamento Financeiro',
		enunciado: 'A reserva de emergência deve cobrir, em média, quantos meses de despesas?',
		alternativa_a: '1 mês',
		alternativa_b: '3 a 6 meses',
		alternativa_c: '9 meses',
		alternativa_d: '12 meses',
		resposta_correta: 'B',
		comentario: 'Recomenda-se cobrir de 3 a 6 meses de despesas.'
	}
];

const RESULTADOS = [
	{
		simulado_numero: 1,
		acertos: 2,
		total_questoes: 3,
		tempo_gasto_segundos: 65 * 60,
		finalizado_automaticamente: false,
		respostas: {
			9001: 'C',
			9002: 'B',
			9003: 'D'
		}
	},
	{
		simulado_numero: 2,
		acertos: 3,
		total_questoes: 3,
		tempo_gasto_segundos: 72 * 60,
		finalizado_automaticamente: false,
		respostas: {
			9011: 'C',
			9012: 'C',
			9013: 'B'
		}
	}
];

async function ensureTestUser() {
	const { data: existing } = await supabaseAdmin.auth.admin.getUserByEmail(TEST_USER.email);

	if (existing?.user) {
		return existing.user.id;
	}

	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: TEST_USER.email,
		password: TEST_USER.password,
		email_confirm: true,
		user_metadata: {
			nome: TEST_USER.nome,
			whatsapp: TEST_USER.whatsapp
		}
	});

	if (error) {
		throw new Error(`Erro ao criar usuário de teste: ${error.message}`);
	}

	const userId = data.user?.id;
	if (!userId) {
		throw new Error('Não foi possível obter o ID do usuário de teste.');
	}

	console.log(`✅ Usuário de teste criado: ${TEST_USER.email}`);
	return userId;
}

async function ensureUsuarioPerfil(userId) {
	const { data, error } = await supabaseAdmin
		.from('usuarios')
		.select('id')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		throw new Error(`Erro ao verificar tabela usuarios: ${error.message}`);
	}

	if (!data) {
		const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
			id: userId,
			nome: TEST_USER.nome,
			email: TEST_USER.email,
			whatsapp: TEST_USER.whatsapp,
			status: TEST_USER.status,
			data_cadastro: new Date().toISOString()
		});

		if (insertError) {
			throw new Error(`Erro ao inserir usuário na tabela usuarios: ${insertError.message}`);
		}

		console.log('✅ Registro inserido na tabela usuarios.');
	}
}

async function seedQuestoes() {
	const { error } = await supabaseAdmin.from('questoes').upsert(QUESTOES, {
		onConflict: 'id'
	});

	if (error) {
		throw new Error(`Erro ao inserir questões fake: ${error.message}`);
	}

	console.log(`✅ ${QUESTOES.length} questões fake garantidas.`);
}

async function seedResultados(userId) {
	const numeros = RESULTADOS.map((r) => r.simulado_numero);

	if (numeros.length) {
		const { error: deleteError } = await supabaseAdmin
			.from('simulados_respostas')
			.delete()
			.eq('user_id', userId)
			.in('simulado_numero', numeros);

		if (deleteError) {
			throw new Error(`Erro ao limpar resultados anteriores: ${deleteError.message}`);
		}
	}

	const payload = RESULTADOS.map((item) => ({
		user_id: userId,
		...item
	}));

	const { error } = await supabaseAdmin.from('simulados_respostas').insert(payload);

	if (error) {
		throw new Error(`Erro ao inserir resultados fake: ${error.message}`);
	}

	console.log(`✅ Resultados fake inseridos para ${TEST_USER.email}.`);
}

async function main() {
	try {
		console.log('🚀 Iniciando seed de dados fake...');
		const userId = await ensureTestUser();
		await ensureUsuarioPerfil(userId);
		await seedQuestoes();
		await seedResultados(userId);
		console.log('🎉 Seed concluído com sucesso. Faça login com:');
		console.log(`   Email: ${TEST_USER.email}`);
		console.log(`   Senha: ${TEST_USER.password}`);
	} catch (err) {
		console.error('❌ Falha na execução do seed:');
		console.error(err);
		process.exit(1);
	}
}

await main();
