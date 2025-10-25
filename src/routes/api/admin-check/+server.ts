import type { RequestHandler } from './$types';import { json } from '@sveltejs/kit';

import { json } from '@sveltejs/kit';import type { RequestHandler } from './$types';

import { isUserAdmin, getConfiguredAdminEmails } from '$lib/server/adminAuth';import { env } from '$env/dynamic/private';



export const GET: RequestHandler = async (event) => {export const GET: RequestHandler = async (event) => {

  try {	try {

    const session = await event.locals.getSession();		const supabase = event.locals.supabase;

    		

    if (!session) {		const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      return json({		

        authenticated: false,		if (sessionError) {

        isAdmin: false,			return json({ error: 'Erro ao obter sessão', details: sessionError.message }, { status: 500 });

        message: 'Usuário não autenticado'		}

      });		

    }		if (!session) {

			return json({ error: 'Usuário não autenticado' }, { status: 401 });

    const isAdmin = await isUserAdmin(session.user);		}

    const adminEmails = getConfiguredAdminEmails();		

		const user = session.user;

    return json({		const adminEmailsEnv = env.ADMIN_ALLOWED_EMAILS ?? '';

      authenticated: true,		const adminEmails = adminEmailsEnv

      isAdmin,			.split(',')

      user: {			.map((item) => item.trim().toLowerCase())

        id: session.user.id,			.filter(Boolean);

        email: session.user.email		

      },		// Verificar se é admin por email

      adminConfig: {		const isAdminByEmail = user.email && adminEmails.includes(user.email.toLowerCase());

        emailsConfigurados: adminEmails.length,		

        emailsAdmin: adminEmails.length > 0 ? adminEmails : ['Nenhum email configurado'],		// Verificar metadata

        hasAdminEmails: adminEmails.length > 0		const metadata = {

      },			app_metadata: user.app_metadata,

      message: isAdmin ? 'Usuário tem permissões de admin' : 'Usuário não tem permissões de admin'			user_metadata: user.user_metadata

    });		};

  } catch (error) {		

    console.error('Erro no admin check:', error);		// Buscar dados na tabela usuarios

    return json({		const { data: userData, error: userError } = await supabase

      authenticated: false,			.from('usuarios')

      isAdmin: false,			.select('*')

      error: 'Erro interno',			.eq('id', user.id)

      message: 'Erro ao verificar permissões'			.single();

    }, { status: 500 });		

  }		return json({

};			user: {
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