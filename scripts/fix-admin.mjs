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

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceKey) {
	console.error('❌ Credenciais do Supabase não encontradas no .env');
	process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
	auth: { persistSession: false }
});

const ADMIN_EMAIL = 'frpdias@icloud.com';

async function checkAdminAccess() {
	try {
		console.log('🔍 Verificando acesso de administrador...');
		
		// Verificar se email está na lista de administradores
		const adminEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
		console.log('📧 Emails de admin autorizados:', adminEmails);
		
		if (adminEmails.includes(ADMIN_EMAIL.toLowerCase())) {
			console.log('✅ Email frpdias@icloud.com está autorizado como administrador');
		} else {
			console.log('❌ Email não está na lista de administradores');
		}
		
		// Verificar usuário no sistema de auth
		const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
		if (error) {
			console.error('❌ Erro ao listar usuários:', error.message);
			return;
		}
		
		const adminUser = users.users.find(u => u.email === ADMIN_EMAIL);
		if (adminUser) {
			console.log('✅ Usuário encontrado no sistema de auth');
			console.log('👤 ID:', adminUser.id);
			console.log('📊 Metadados:', JSON.stringify(adminUser.user_metadata, null, 2));
		} else {
			console.log('❌ Usuário não encontrado no sistema de auth');
			
			// Criar usuário
			console.log('🔄 Criando usuário administrador...');
			const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
				email: ADMIN_EMAIL,
				password: '123456',
				email_confirm: true,
				user_metadata: {
					role: 'admin',
					nome: 'Administrador'
				}
			});
			
			if (createError) {
				console.error('❌ Erro ao criar usuário:', createError.message);
			} else {
				console.log('✅ Usuário criado com sucesso:', newUser.user?.id);
			}
		}
		
		// Verificar tabela usuarios
		if (adminUser) {
			const { data: usuarioData, error: usuarioError } = await supabaseAdmin
				.from('usuarios')
				.select('*')
				.eq('id', adminUser.id)
				.single();
				
			if (usuarioError && usuarioError.code !== 'PGRST116') {
				console.error('❌ Erro ao verificar tabela usuarios:', usuarioError.message);
			} else if (usuarioData) {
				console.log('✅ Registro encontrado na tabela usuarios');
			} else {
				console.log('⚠️  Criando registro na tabela usuarios...');
				const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
					id: adminUser.id,
					email: ADMIN_EMAIL,
					nome: 'Administrador',
					status: 'ativo',
					data_cadastro: new Date().toISOString()
				});
				
				if (insertError) {
					console.error('❌ Erro ao criar registro na tabela usuarios:', insertError.message);
				} else {
					console.log('✅ Registro criado na tabela usuarios');
				}
			}
		}
		
	} catch (err) {
		console.error('❌ Erro geral:', err);
	}
}

await checkAdminAccess();