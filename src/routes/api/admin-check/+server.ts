import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async (event) => {
	try {
		const supabase = event.locals.supabase;
		
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		
		if (sessionError) {
			return json({ error: 'Erro ao obter sessão', details: sessionError.message }, { status: 500 });
		}
		
		if (!session) {
			return json({ error: 'Usuário não autenticado' }, { status: 401 });
		}
		
		const user = session.user;
		const adminEmailsEnv = env.ADMIN_ALLOWED_EMAILS ?? '';
		const adminEmails = adminEmailsEnv
			.split(',')
			.map((item) => item.trim().toLowerCase())
			.filter(Boolean);
		
		// Verificar se é admin por email
		const isAdminByEmail = user.email && adminEmails.includes(user.email.toLowerCase());
		
		// Verificar metadata
		const metadata = {
			app_metadata: user.app_metadata,
			user_metadata: user.user_metadata
		};
		
		// Buscar dados na tabela usuarios
		const { data: userData, error: userError } = await supabase
			.from('usuarios')
			.select('*')
			.eq('id', user.id)
			.single();
		
		return json({
			user: {
				id: user.id,
				email: user.email,
				created_at: user.created_at
			},
			adminConfig: {
				adminEmailsConfigured: !!adminEmailsEnv,
				adminEmailsList: adminEmails,
				isAdminByEmail,
				userEmailInList: adminEmails.includes(user.email?.toLowerCase() || '')
			},
			metadata,
			userData: userError ? { error: userError.message } : userData,
			debug: {
				rawAdminEmails: adminEmailsEnv,
				userEmail: user.email?.toLowerCase()
			}
		});
		
	} catch (err) {
		console.error('❌ Erro no admin-check:', err);
		return json({ error: 'Erro interno', details: String(err) }, { status: 500 });
	}
};