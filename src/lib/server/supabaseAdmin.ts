import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const supabaseUrl = (env.VITE_SUPABASE_URL ?? '').trim();
const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\\n/g, '').trim();

if (!supabaseUrl) {
	throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!serviceRoleKey) {
	throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
	auth: {
		persistSession: false
	}
});
