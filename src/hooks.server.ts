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
				console.error('Erro ao obter sessão:', error);
				return null;
			}
		};

		return resolve(event, {
			filterSerializedResponseHeaders(name) {
				return name === 'content-range';
			}
		});
	} catch (error) {
		console.error('Erro no handle:', error);
		return resolve(event);
	}
};
