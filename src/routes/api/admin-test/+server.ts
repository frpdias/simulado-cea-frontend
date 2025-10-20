import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ locals, url }: any) {
	try {
		console.log('🔍 Admin Test - Iniciando diagnóstico...');
		
		// Verificar variáveis de ambiente
		const envCheck = {
			supabase_url: env.VITE_SUPABASE_URL ? 'configured' : 'missing',
			supabase_key: env.VITE_SUPABASE_KEY ? 'configured' : 'missing',
			admin_emails: env.ADMIN_ALLOWED_EMAILS ? 'configured' : 'missing',
			admin_emails_value: env.ADMIN_ALLOWED_EMAILS
		};
		
		// Verificar Supabase
		const supabaseCheck = {
			client_available: !!locals.supabase,
			getSession_available: typeof locals.getSession === 'function'
		};
		
		// Tentar obter sessão
		let sessionCheck = { has_session: false, user_email: null, error: null };
		try {
			if (locals.getSession) {
				const session = await locals.getSession();
				sessionCheck = {
					has_session: !!session,
					user_email: session?.user?.email || null,
					error: null
				};
			}
		} catch (err: any) {
			sessionCheck.error = err?.message || 'Erro desconhecido';
		}
		
		return json({
			timestamp: new Date().toISOString(),
			url: url.pathname,
			env: envCheck,
			supabase: supabaseCheck,
			session: sessionCheck
		});
		
	} catch (error: any) {
		console.error('❌ Erro no admin test:', error);
		return json({
			error: error?.message || 'Erro desconhecido',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
}