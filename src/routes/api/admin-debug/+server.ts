import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async (event) => {
	try {
		const supabase = event.locals.supabase;
		const session = await event.locals.getSession();
		
		if (!session) {
			return json({
				error: 'Não autenticado',
				session: null,
				user: null
			});
		}

		const user = session.user;
		const adminEmails = (env.ADMIN_ALLOWED_EMAILS ?? '')
			.split(',')
			.map((item) => item.trim().toLowerCase())
			.filter(Boolean);

		// Verificar tabela usuarios
		let tabelaUsuarios = null;
		let erroTabela = null;
		
		try {
			const { data, error } = await supabase
				.from('usuarios')
				.select('papel')
				.eq('id', user.id)
				.maybeSingle();
			
			if (error) {
				erroTabela = error.message;
			} else {
				tabelaUsuarios = data;
			}
		} catch (err) {
			erroTabela = `Erro de conexão: ${err}`;
		}

		return json({
			session: !!session,
			user: {
				id: user.id,
				email: user.email,
				metadata: user.user_metadata,
				app_metadata: user.app_metadata
			},
			admin_config: {
				emails_configurados: adminEmails.length,
				emails_admin: adminEmails,
				modo_emergencia: adminEmails.length === 0
			},
			verificacoes: {
				email_na_lista: adminEmails.includes(user.email?.toLowerCase() ?? ''),
				metadata_admin: checkMetadata(user),
				tabela_usuarios: tabelaUsuarios,
				erro_tabela: erroTabela
			}
		});
	} catch (error) {
		return json({
			error: `Erro no debug: ${error}`,
			details: error instanceof Error ? error.message : 'Erro desconhecido'
		}, { status: 500 });
	}
};

function checkMetadata(user: any) {
	const metaCandidates = [
		user.app_metadata?.role,
		user.app_metadata?.roles,
		user.user_metadata?.role,
		user.user_metadata?.perfil,
		user.user_metadata?.papel
	];

	for (const entry of metaCandidates) {
		if (typeof entry === 'string' && isAdminValue(entry)) {
			return { found: true, value: entry };
		}

		if (Array.isArray(entry) && entry.some((valor) => typeof valor === 'string' && isAdminValue(valor))) {
			return { found: true, value: entry };
		}
	}

	return { found: false, candidates: metaCandidates };
}

function isAdminValue(valor: string) {
	const normalizado = valor.trim().toLowerCase();
	return normalizado === 'admin' || normalizado === 'administrador';
}