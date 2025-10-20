import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET() {
	return json({
		env_check: {
			supabase_url: env.VITE_SUPABASE_URL ? 'configured' : 'missing',
			supabase_key: env.VITE_SUPABASE_KEY ? 'configured' : 'missing',
			admin_emails: env.ADMIN_ALLOWED_EMAILS ? 'configured' : 'missing',
			service_role: env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
		},
		timestamp: new Date().toISOString()
	});
}