#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv() {
	const envPath = resolve(process.cwd(), '.env');
	if (!existsSync(envPath)) return;

	for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const idx = line.indexOf('=');
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		const value = line.slice(idx + 1).trim();
		if (key && !(key in process.env)) {
			process.env[key] = value;
		}
	}
}

loadDotEnv();

const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\\n/g, '').trim();

if (!supabaseUrl) {
	console.error('❌ Defina VITE_SUPABASE_URL no .env antes de executar este script.');
	process.exit(1);
}

if (!serviceKey) {
	console.error('❌ Defina SUPABASE_SERVICE_ROLE_KEY (service role) no .env antes de executar este script.');
	process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
	auth: { persistSession: false }
});

const ADMIN_USER = {
	email: 'frpdias@icloud.com',
	password: '123456',
	nome: 'Administrador',
	whatsapp: '',
	status: 'ativo'
};

async function ensureAuthUser() {
	const { data, error } = await supabaseAdmin.auth.admin.listUsers({
		email: ADMIN_USER.email,
		perPage: 1
	});

	if (error) {
		throw new Error(`Erro ao pesquisar usuário admin: ${error.message}`);
	}

	const existing = data?.users?.[0];

	if (existing) {
		const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
			email: ADMIN_USER.email,
			password: ADMIN_USER.password,
			user_metadata: {
				...(existing.user_metadata ?? {}),
				role: 'admin',
				nome: ADMIN_USER.nome,
				whatsapp: ADMIN_USER.whatsapp
			}
		});

		if (updateError) {
			throw new Error(`Erro ao atualizar usuário admin existente: ${updateError.message}`);
		}

		return existing.id;
	}

	const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
		email: ADMIN_USER.email,
		password: ADMIN_USER.password,
		email_confirm: true,
		user_metadata: {
			role: 'admin',
			nome: ADMIN_USER.nome,
			whatsapp: ADMIN_USER.whatsapp
		}
	});

	if (createError) {
		throw new Error(`Erro ao criar usuário admin: ${createError.message}`);
	}

	const userId = created.user?.id;
	if (!userId) {
		throw new Error('Erro inesperado: ID do usuário admin não retornado.');
	}

	return userId;
}

async function ensureUsuariosRegistro(userId) {
	const { data, error } = await supabaseAdmin
		.from('usuarios')
		.select('id')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		throw new Error(`Erro ao verificar tabela usuarios: ${error.message}`);
	}

	if (data) {
		const { error: updateError } = await supabaseAdmin.from('usuarios').update({
			email: ADMIN_USER.email,
			nome: ADMIN_USER.nome,
			whatsapp: ADMIN_USER.whatsapp,
			status: ADMIN_USER.status
		}).eq('id', userId);

		if (updateError) {
			throw new Error(`Erro ao atualizar registro admin na tabela usuarios: ${updateError.message}`);
		}

		return;
	}

	const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
		id: userId,
		email: ADMIN_USER.email,
		nome: ADMIN_USER.nome,
		whatsapp: ADMIN_USER.whatsapp,
		status: ADMIN_USER.status,
		data_cadastro: new Date().toISOString()
	});

	if (insertError) {
		throw new Error(`Erro ao inserir registro admin na tabela usuarios: ${insertError.message}`);
	}
}

async function main() {
	try {
		console.log('🔐 Garantindo usuário administrador...');
		const userId = await ensureAuthUser();
		await ensureUsuariosRegistro(userId);
		console.log(`✅ Administrador configurado: ${ADMIN_USER.email}`);
	} catch (err) {
		console.error('❌ Falha ao configurar administrador:');
		console.error(err);
		process.exit(1);
	}
}

await main();
