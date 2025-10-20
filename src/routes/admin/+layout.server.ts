import type { LayoutServerLoad } from './$types';
import type { User } from '@supabase/supabase-js';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const adminEmails = (env.ADMIN_ALLOWED_EMAILS ?? '')
	.split(',')
	.map((item) => item.trim().toLowerCase())
	.filter(Boolean);

function metadataIndicaAdmin(user: User) {
	const metaCandidates: Array<unknown> = [
		user.app_metadata?.role,
		user.app_metadata?.roles,
		user.user_metadata?.role,
		user.user_metadata?.perfil,
		user.user_metadata?.papel
	];

	for (const entry of metaCandidates) {
		if (typeof entry === 'string' && ehValorAdmin(entry)) {
			return true;
		}

		if (Array.isArray(entry) && entry.some((valor) => typeof valor === 'string' && ehValorAdmin(valor))) {
			return true;
		}
	}

	return false;
}

function ehValorAdmin(valor: string) {
	const normalizado = valor.trim().toLowerCase();
	return normalizado === 'admin' || normalizado === 'administrador';
}

export const load: LayoutServerLoad = async (event) => {
	try {
		const supabase = event.locals.supabase;
		if (!supabase) {
			console.error('❌ Supabase client não configurado');
			throw error(500, 'Dependência de autenticação não configurada.');
		}
		
		const session = await event.locals.getSession();

		if (!session) {
			const redirectTo = encodeURIComponent(event.url.pathname);
			throw redirect(303, `/login?redirectTo=${redirectTo}`);
		}

		const user = session.user;
		const email = user.email?.toLowerCase() ?? '';

		let autorizado = false;

		if (email && adminEmails.includes(email)) {
			autorizado = true;
		}

		if (!autorizado && metadataIndicaAdmin(user)) {
			autorizado = true;
		}

		if (!autorizado) {
			const { data: perfil, error: perfilError } = await supabase
				.from('usuarios')
				.select('perfil, papel, role, tipo, status')
				.eq('id', user.id)
				.maybeSingle();

			if (perfilError) {
				console.error('Erro ao verificar perfil do usuário para o admin:', perfilError);
			}

			const possivelPapel =
				(typeof perfil?.perfil === 'string' && perfil.perfil) ||
				(typeof perfil?.papel === 'string' && perfil.papel) ||
				(typeof perfil?.role === 'string' && perfil.role) ||
				(typeof perfil?.tipo === 'string' && perfil.tipo) ||
				(typeof perfil?.status === 'string' && perfil.status);

			if (possivelPapel && ehValorAdmin(possivelPapel)) {
				autorizado = true;
			}
		}

		if (!autorizado) {
			throw error(403, 'Acesso permitido apenas a administradores.');
		}

		return {
			supabase,
			adminUser: {
				id: user.id,
				email: user.email,
				nome: (user.user_metadata?.nome as string | undefined) ?? user.email
			}
		};
	} catch (err) {
		console.error('❌ Erro no layout admin:', err);
		
		// Se for um erro de redirect ou error do SvelteKit, re-throw
		if (err instanceof Error && (err.message.includes('redirect') || err.message.includes('error'))) {
			throw err;
		}
		
		// Para outros erros, logar e retornar erro 500
		throw error(500, 'Erro interno do servidor');
	}
};
