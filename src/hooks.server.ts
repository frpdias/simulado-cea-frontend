import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getSecurityHeaders, logSecurityEvent } from '$lib/server/security';

const supabaseUrl = (env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_KEY ?? '').trim();

if (!supabaseUrl) {
	throw new Error('VITE_SUPABASE_URL não está configurada.');
}

if (!supabaseAnonKey) {
	throw new Error('VITE_SUPABASE_KEY não está configurada.');
}

const log = (...args: unknown[]) => {
	if (dev) {
		console.log(...args);
	}
};

const logError = (...args: unknown[]) => {
	if (dev) {
		console.error(...args);
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	try {
		event.locals.supabase = createSupabaseServerClient({
			supabaseUrl,
			supabaseKey: supabaseAnonKey,
			event
		}) as any;

		event.locals.getSession = async () => {
			try {
				const {
					data: { session }
				} = await event.locals.supabase.auth.getSession();
				return session;
			} catch (error) {
				logError('Erro ao obter sessão', error);
				return null;
			}
		};

		// Obter a sessão e adicionar aos locals para conveniência
		const session = await event.locals.getSession();
		event.locals.session = session;

		// Log de acesso para endpoints críticos
		if (event.url.pathname.startsWith('/api/')) {
			logSecurityEvent('api_access', {
				endpoint: event.url.pathname,
				method: event.request.method
			}, event.request);
		}

		const response = await resolve(event, {
			filterSerializedResponseHeaders(name) {
				return name === 'content-range';
			}
		});

		// Aplicar headers de segurança globalmente
		const securityHeaders = getSecurityHeaders();
		Object.entries(securityHeaders).forEach(([name, value]) => {
			response.headers.set(name, value);
		});
		
		return response;
	} catch (error) {
		logError('Erro no hook handle', error);

		if (event.url.pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return resolve(event);
	}
};
