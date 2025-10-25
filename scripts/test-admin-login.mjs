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
const anonKey = (process.env.VITE_SUPABASE_KEY ?? '').trim();

if (!supabaseUrl || !anonKey) {
	console.error('❌ Configure VITE_SUPABASE_URL e VITE_SUPABASE_KEY no .env');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function testAdminLogin() {
	const adminEmail = 'frpdias@icloud.com';
	const adminPassword = '123456';
	
	console.log('🔍 Testando login do administrador...');
	console.log(`Email: ${adminEmail}`);
	
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: adminEmail,
			password: adminPassword
		});
		
		if (error) {
			console.error('❌ Erro no login:');
			console.error(`   Código: ${error.message}`);
			console.error(`   Descrição: ${error.status || 'N/A'}`);
			
			// Tentar com outra senha comum
			console.log('\n🔄 Tentando senha alternativa...');
			const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
				email: adminEmail,
				password: 'admin123'
			});
			
			if (error2) {
				console.error('❌ Segunda tentativa também falhou:');
				console.error(`   Código: ${error2.message}`);
				return;
			}
			
			console.log('✅ Login bem-sucedido com senha alternativa!');
			console.log(`   User ID: ${data2.user?.id}`);
			console.log(`   Email: ${data2.user?.email}`);
			console.log(`   Metadata: ${JSON.stringify(data2.user?.user_metadata, null, 2)}`);
			return;
		}
		
		console.log('✅ Login bem-sucedido!');
		console.log(`   User ID: ${data.user?.id}`);
		console.log(`   Email: ${data.user?.email}`);
		console.log(`   Metadata: ${JSON.stringify(data.user?.user_metadata, null, 2)}`);
		
		// Verificar se é admin
		const metadata = data.user?.user_metadata;
		const isAdmin = metadata?.role === 'admin' || metadata?.papel === 'admin';
		
		console.log(`\n🛡️  Status de Admin: ${isAdmin ? '✅ SIM' : '❌ NÃO'}`);
		
		if (!isAdmin) {
			console.log('⚠️  Usuário não tem role de admin nos metadados');
		}
		
	} catch (err) {
		console.error('❌ Erro inesperado:', err);
	}
}

await testAdminLogin();