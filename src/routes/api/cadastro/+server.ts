import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { 
	securityMiddleware, 
	sanitizeInput, 
	isValidEmail, 
	isValidPassword,
	logSecurityEvent,
	getSecurityHeaders 
} from '$lib/server/security';

export const POST: RequestHandler = async (event) => {
	try {
		// Aplicar middleware de segurança
		securityMiddleware(event, 'AUTH');
		
		const { request } = event;
		const payload = await request.json();
		
		// Sanitizar e validar inputs
		const nome = sanitizeInput(payload?.nome).trim();
		const email = sanitizeInput(payload?.email).trim().toLowerCase();
		const whatsapp = sanitizeInput(payload?.whatsapp).trim();
		const senha = String(payload?.senha ?? '');

		// Validações de segurança
		if (!nome || nome.length < 2 || nome.length > 100) {
			logSecurityEvent('cadastro_invalid_name', { nome: nome.substring(0, 10) }, request);
			return json({ success: false, error: 'Nome deve ter entre 2 e 100 caracteres.' }, { 
				status: 400,
				headers: getSecurityHeaders()
			});
		}

		if (!isValidEmail(email)) {
			logSecurityEvent('cadastro_invalid_email', { email: email.substring(0, 10) }, request);
			return json({ success: false, error: 'Email inválido.' }, { 
				status: 400,
				headers: getSecurityHeaders()
			});
		}

		if (!whatsapp || whatsapp.length < 10 || whatsapp.length > 20) {
			logSecurityEvent('cadastro_invalid_whatsapp', { whatsapp: whatsapp.substring(0, 5) }, request);
			return json({ success: false, error: 'WhatsApp deve ter entre 10 e 20 caracteres.' }, { 
				status: 400,
				headers: getSecurityHeaders()
			});
		}

		if (!isValidPassword(senha)) {
			logSecurityEvent('cadastro_weak_password', { email }, request);
			return json({ 
				success: false, 
				error: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número.' 
			}, { 
				status: 400,
				headers: getSecurityHeaders()
			});
		}

		const { data: existingUser, error: existingError } = await supabaseAdmin
			.from('usuarios')
			.select('id')
			.eq('email', email)
			.limit(1)
			.maybeSingle();

		if (existingError) {
			console.error('Cadastro: erro ao verificar usuário existente', existingError);
			logSecurityEvent('cadastro_db_error', { error: existingError.message }, request);
			const message = existingError.message?.toLowerCase() ?? '';
			const apiKeyIssue =
				message.includes('invalid api key') || message.includes('no suitable key') || message.includes('jwserror');
			const errorText = apiKeyIssue
				? 'Configuração do Supabase inválida. Verifique a chave SUPABASE_SERVICE_ROLE_KEY no painel do Vercel.'
				: 'Erro ao verificar dados existentes.';
			return json({ success: false, error: errorText }, { 
				status: 500,
				headers: getSecurityHeaders()
			});
		}

		if (existingUser) {
			logSecurityEvent('cadastro_duplicate_email', { email }, request);
			return json(
				{ success: false, error: 'E-mail já cadastrado. Faça login ou recupere sua senha.' },
				{ status: 409, headers: getSecurityHeaders() }
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
				status: 'ativo',
				data_cadastro: new Date().toISOString()
			});

		if (insertError) {
			console.error('Cadastro: erro ao inserir usuário na tabela usuarios', insertError);
			await supabaseAdmin.auth.admin.deleteUser(userId);
			return json({ success: false, error: insertError.message }, { 
				status: 400,
				headers: getSecurityHeaders()
			});
		}

		// Log de sucesso (sem dados sensíveis)
		logSecurityEvent('cadastro_success', { email, userId: userId.substring(0, 8) }, request);
		return json({ success: true }, { 
			status: 201,
			headers: getSecurityHeaders()
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Erro interno';
		logSecurityEvent('cadastro_exception', { error: message }, event.request);
		console.error('Cadastro: exceção não tratada', err);
		return json({ success: false, error: 'Erro interno do servidor.' }, { 
			status: 500,
			headers: getSecurityHeaders()
		});
	}
};
