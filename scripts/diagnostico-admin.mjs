#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase para produção
const supabaseUrl = 'https://zcrzyhdzjanivracmoub.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjcnp5aGR6amFuaXZyYWNtb3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDUwOTEsImV4cCI6MjA3MzgyMTA5MX0.heBPLB4Br-eCZegPRmf64RwfZ15dz2ymDBuMatc-LoQ';

const supabase = createClient(supabaseUrl, anonKey);

async function diagnosticarAdmin() {
	console.log('🔍 DIAGNÓSTICO DO LOGIN ADMIN');
	console.log('=' * 50);
	
	// Testar emails diferentes que podem estar configurados
	const testEmails = [
		'frpdias@icloud.com',
		'frpdias@hotmail.com',
		'admin@exemplo.com'
	];
	
	const testPasswords = [
		'123456',
		'admin123',
		'password'
	];
	
	console.log('\n📧 Testando combinações de email/senha...\n');
	
	for (const email of testEmails) {
		console.log(`\n🔑 Testando email: ${email}`);
		
		for (const password of testPasswords) {
			try {
				const { data, error } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				
				if (!error && data.user) {
					console.log(`✅ LOGIN SUCESSO!`);
					console.log(`   Senha: ${password}`);
					console.log(`   User ID: ${data.user.id}`);
					console.log(`   Metadata: ${JSON.stringify(data.user.user_metadata, null, 2)}`);
					
					// Verificar se tem role admin
					const isAdmin = data.user.user_metadata?.role === 'admin';
					console.log(`   🛡️ É Admin: ${isAdmin ? '✅ SIM' : '❌ NÃO'}`);
					
					// Fazer logout para próximo teste
					await supabase.auth.signOut();
					return { email, password, user: data.user };
				} else {
					console.log(`   ❌ Falha com senha: ${password}`);
				}
			} catch (err) {
				console.log(`   ⚠️ Erro com senha ${password}: ${err.message}`);
			}
		}
	}
	
	console.log('\n❌ Nenhuma combinação funcionou!');
	console.log('\n📋 POSSÍVEIS SOLUÇÕES:');
	console.log('1. Verificar se ADMIN_ALLOWED_EMAILS está configurado no Vercel');
	console.log('2. Executar script ensure-admin.mjs para criar/atualizar usuário');
	console.log('3. Verificar se SUPABASE_SERVICE_ROLE_KEY está correto');
	
	return null;
}

const resultado = await diagnosticarAdmin();

if (resultado) {
	console.log(`\n🎯 CONCLUSÃO: Use ${resultado.email} com senha "${resultado.password}"`);
}