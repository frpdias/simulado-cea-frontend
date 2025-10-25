import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_KEY ?? '').trim();

if (!supabaseUrl) {
	throw new Error('VITE_SUPABASE_URL não configurada.');
}

if (!supabaseKey) {
	throw new Error('VITE_SUPABASE_KEY não configurada.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
