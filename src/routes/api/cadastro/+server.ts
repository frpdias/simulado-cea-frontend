import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.json();
		const nome = String(payload?.nome ?? '').trim();
		const email = String(payload?.email ?? '').trim().toLowerCase();
		const whatsapp = String(payload?.whatsapp ?? '').trim();
		const senha = String(payload?.senha ?? '');

		if (!nome || !email || !whatsapp || !senha) {
			return json({ success: false, error: 'Dados obrigatórios ausentes.' }, { status: 400 });
		}

		if (senha.length < 6) {
			return json({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
		}

		const { data: existingUser, error: existingError } = await supabaseAdmin
			.from('usuarios')
			.select('id')
			.eq('email', email)
			.limit(1)
			.maybeSingle();

		if (existingError) {
			console.error('Cadastro: erro ao verificar usuário existente', existingError);
			const message = existingError.message?.toLowerCase() ?? '';
			const apiKeyIssue =
				message.includes('invalid api key') || message.includes('no suitable key') || message.includes('jwserror');
			const errorText = apiKeyIssue
				? 'Configuração do Supabase inválida. Verifique a chave SUPABASE_SERVICE_ROLE_KEY no painel do Vercel.'
				: 'Erro ao verificar dados existentes.';
			return json({ success: false, error: errorText }, { status: 500 });
		}

		if (existingUser) {
			return json(
				{ success: false, error: 'E-mail já cadastrado. Faça login ou recupere sua senha.' },
				{ status: 409 }
			);
		}

		const { data, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: senha,
			email_confirm: true,
			user_metadata: {
				nome,
				whatsapp
			}
		});

		if (createUserError) {
			console.error('Cadastro: erro ao criar usuário no Supabase Auth', createUserError);
			return json({ success: false, error: createUserError.message }, { status: 400 });
		}

		const userId = data.user?.id;
		if (!userId) {
			return json({ success: false, error: 'Não foi possível obter o ID do usuário.' }, { status: 500 });
		}

		const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
			id: userId,
			nome,
			email,
			whatsapp,
			status: 'Ativo',
			data_cadastro: new Date().toISOString()
		});

		if (insertError) {
			console.error('Cadastro: erro ao inserir usuário na tabela usuarios', insertError);
			await supabaseAdmin.auth.admin.deleteUser(userId);
			return json({ success: false, error: insertError.message }, { status: 400 });
		}

		return json({ success: true }, { status: 201 });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Erro interno';
		console.error('Cadastro: exceção não tratada', err);
		return json({ success: false, error: message }, { status: 500 });
	}
};
