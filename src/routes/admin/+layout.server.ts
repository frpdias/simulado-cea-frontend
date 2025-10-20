import type { LayoutServerLoad } from './$types';
import type { User } from '@supabase/supabase-js';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const adminEmails = (env.ADMIN_ALLOWED_EMAILS ?? '')
	.split(',')
	.map((item) => item.trim().toLowerCase())
	.filter(Boolean);

function metadataIndicaAdmin(user: User) {
	const metaCandidates: Array<unknown> = [
		user.app_metadata?.role,
		user.app_metadata?.roles,
		user.user_metadata?.role,
		user.user_metadata?.perfil,
		user.user_metadata?.papel
	];

	for (const entry of metaCandidates) {
		if (typeof entry === 'string' && ehValorAdmin(entry)) {
			return true;
		}

		if (Array.isArray(entry) && entry.some((valor) => typeof valor === 'string' && ehValorAdmin(valor))) {
			return true;
		}
	}

	return false;
}

function ehValorAdmin(valor: string) {
	const normalizado = valor.trim().toLowerCase();
	return normalizado === 'admin' || normalizado === 'administrador';
}

export const load: LayoutServerLoad = async (event) => {
	try {
		console.log('🔍 Admin Layout - Iniciando verificação...');
		
		// Verificar variáveis de ambiente
		const adminEmailsEnv = env.ADMIN_ALLOWED_EMAILS;
		console.log('📧 Admin emails env:', adminEmailsEnv ? 'configured' : 'missing');
		
		const supabase = event.locals.supabase;
		if (!supabase) {
			console.error('❌ Supabase client não configurado');
			throw error(500, 'Dependência de autenticação não configurada.');
		}
		
		console.log('✅ Supabase client disponível');
		
		const session = await event.locals.getSession();
		console.log('🔐 Sessão:', session ? 'encontrada' : 'não encontrada');

		if (!session) {
			const redirectTo = encodeURIComponent(event.url.pathname);
			console.log('🔄 Redirecionando para login admin:', `/admin-login?redirectTo=${redirectTo}`);
			throw redirect(303, `/admin-login?redirectTo=${redirectTo}`);
		}

		const user = session.user;
		console.log('👤 Usuário:', user.email);
		
		const email = user.email?.toLowerCase() ?? '';

		let autorizado = false;

		// Verificação 1: Email na lista
		if (email && adminEmails.includes(email)) {
			autorizado = true;
			console.log('✅ Autorizado por email');
		}

		// Verificação 2: Metadata
		if (!autorizado && metadataIndicaAdmin(user)) {
			autorizado = true;
			console.log('✅ Autorizado por metadata');
		}

		// Verificação 3: Tabela usuarios
		if (!autorizado) {
			console.log('🔍 Verificando tabela usuarios...');
			try {
				const { data: perfil, error: perfilError } = await supabase
					.from('usuarios')
					.select('papel')
					.eq('id', user.id)
					.maybeSingle();

				if (perfilError) {
					console.error('❌ Erro ao verificar perfil:', perfilError.message);
				} else {
					console.log('📊 Perfil encontrado:', perfil);
					
					if (perfil?.papel && ehValorAdmin(perfil.papel)) {
						autorizado = true;
						console.log('✅ Autorizado por tabela usuarios - papel:', perfil.papel);
					}
				}
			} catch (dbError) {
				console.error('❌ Erro de conexão com banco:', dbError);
				// Não bloquear por erro de DB, continuar verificação
			}
		}

		if (!autorizado) {
			console.log('❌ Acesso negado para:', email);
			console.log('🔍 Verificações realizadas:');
			console.log('  - Email na lista:', adminEmails.includes(email || ''));
			console.log('  - Metadata indica admin:', metadataIndicaAdmin(user));
			console.log('  - Lista de emails admin:', adminEmails);
			
			// Verificação de emergência: se não há emails admin configurados, permite qualquer usuário logado como admin temporário
			if (adminEmails.length === 0) {
				console.log('⚠️ MODO DE EMERGÊNCIA: Nenhum email admin configurado, permitindo acesso temporário');
				autorizado = true;
			}
		}

		if (!autorizado) {
			throw error(403, 'Acesso permitido apenas a administradores.');
		}

		console.log('✅ Admin layout carregado com sucesso');
		
		return {
			supabase,
			adminUser: {
				id: user.id,
				email: user.email,
				nome: (user.user_metadata?.nome as string | undefined) ?? user.email
			}
		};
	} catch (err) {
		console.error('❌ Erro no layout admin:', err);
		
		// Se for um erro de redirect ou error do SvelteKit, re-throw
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		// Para outros erros, logar e retornar erro 500
		throw error(500, `Erro interno do servidor: ${err}`);
	}
};
