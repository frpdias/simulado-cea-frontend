import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');

	if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
		return json({ success: false, error: 'Não autenticado.' }, { status: 401 });
	}

	const token = authHeader.slice(7);

	let userId: string | null = null;

	try {
		const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
		if (userError || !userData?.user) {
			throw new Error('Sessão inválida.');
		}
		userId = userData.user.id;
	} catch (err) {
		return json({ success: false, error: 'Sessão inválida.' }, { status: 401 });
	}

	const payload = await request.json();

	const simuladoNumero = Number(payload?.simuladoNumero);
	const respostas = payload?.respostas ?? {};
	const acertos = Number(payload?.acertos ?? 0);
	const total = Number(payload?.total ?? 0);
	const tempoGastoSegundos = Number(payload?.tempoGastoSegundos ?? 0);
	const finalizadoAutomaticamente = Boolean(payload?.finalizadoAutomaticamente);

	if (!simuladoNumero || !total) {
		return json({ success: false, error: 'Dados insuficientes para registrar o resultado.' }, { status: 400 });
	}

	try {
		const { error } = await supabaseAdmin.from('simulados_respostas').insert({
			user_id: userId,
			simulado_numero: simuladoNumero,
			acertos,
			total_questoes: total,
			tempo_gasto_segundos: tempoGastoSegundos,
			finalizado_automaticamente: finalizadoAutomaticamente,
			respostas
		});

		if (error) {
			throw error;
		}

		return json({ success: true });
	} catch (error: any) {
		const message =
			error?.message ??
			'Não foi possível registrar o resultado. Verifique se a tabela simulados_respostas existe.';
		return json({ success: false, error: message }, { status: 500 });
	}
};
