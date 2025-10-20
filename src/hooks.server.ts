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
	event.locals.supabase = createSupabaseServerClient({
		supabaseUrl,
		supabaseKey: supabaseAnonKey,
		event
	}) as any;

	event.locals.getSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};
