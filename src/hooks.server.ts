import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
	throw new Error('VITE_SUPABASE_URL não está configurada.');
}

if (!supabaseAnonKey) {
	throw new Error('VITE_SUPABASE_KEY não está configurada.');
}

export const handle: Handle = async ({ event, resolve }) => {
	try {
		console.log('🔍 Hook - Processando requisição para:', event.url.pathname);
		
		// Verificar variáveis de ambiente
		if (!supabaseUrl) {
			console.error('❌ VITE_SUPABASE_URL não configurada');
			throw new Error('VITE_SUPABASE_URL não está configurada.');
		}
		
		if (!supabaseAnonKey) {
			console.error('❌ VITE_SUPABASE_KEY não configurada');
			throw new Error('VITE_SUPABASE_KEY não está configurada.');
		}
		
		console.log('✅ Variáveis de ambiente configuradas');

		event.locals.supabase = createSupabaseServerClient({
			supabaseUrl,
			supabaseKey: supabaseAnonKey,
			event
		}) as any;

		event.locals.getSession = async () => {
			try {
				console.log('🔐 Obtendo sessão...');
				const {
					data: { session }
				} = await event.locals.supabase.auth.getSession();
				console.log('✅ Sessão obtida:', session ? 'válida' : 'nula');
				return session;
			} catch (error) {
				console.error('❌ Erro ao obter sessão:', error);
				return null;
			}
		};

		const response = await resolve(event, {
			filterSerializedResponseHeaders(name) {
				return name === 'content-range';
			}
		});
		
		console.log('✅ Requisição processada com sucesso');
		return response;
	} catch (error) {
		console.error('❌ Erro no handle:', error);
		
		// Para requisições de API, retorna erro JSON
		if (event.url.pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		
		// Para outras requisições, tenta resolver sem o supabase
		return resolve(event);
	}
};
