import { mercadoPagoPayment } from '$lib/server/mercadoPago';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from './$types';

async function buscarPagamento(paymentId: string) {
	try {
		const result = await mercadoPagoPayment.get({ id: paymentId });
		return result;
	} catch (err) {
		console.error('[MercadoPago webhook] Falha ao obter pagamento', paymentId, err);
		return null;
	}
}

async function processarNotificacao(topic: string | null, paymentId: string | null) {
	if (!topic || topic !== 'payment') {
		return;
}

	if (!paymentId) {
		console.warn('[MercadoPago webhook] Notificação de pagamento sem id');
		return;
	}

	const pagamento = await buscarPagamento(paymentId);
	if (!pagamento) return;

	console.info('[MercadoPago webhook] Pagamento recebido', pagamento.id, pagamento.status);
	// TODO: atualizar banco (ex.: liberar acesso ou registrar pagamento)
	const metadata = pagamento.metadata as { userId?: string } | null;

	if (!metadata?.userId) {
		console.warn('[MercadoPago webhook] Pagamento sem metadata.userId, nada a atualizar.');
		return;
	}

	const novoStatus = mapearStatusUsuario(pagamento.status ?? 'pending');

	const dadosPagamento = {
		payment_id: String(pagamento.id),
		user_id: metadata.userId,
		status: pagamento.status,
		status_detail: pagamento.status_detail ?? null,
		valor: pagamento.transaction_amount ?? null,
		moeda: pagamento.currency_id ?? null,
		metodo: pagamento.payment_method_id ?? null,
		tipo: pagamento.payment_type_id ?? null,
		raw_data: pagamento as unknown as Record<string, unknown>
	};

	const { error: pagamentoErro } = await supabaseAdmin
		.from('pagamentos')
		.upsert(dadosPagamento, { onConflict: 'payment_id' });

	if (pagamentoErro) {
		console.error('[MercadoPago webhook] Erro ao registrar pagamento', pagamento.id, pagamentoErro);
	}

	const { error } = await supabaseAdmin.from('usuarios').update({ status: novoStatus }).eq('id', metadata.userId);

	if (error) {
		console.error('[MercadoPago webhook] Falha ao atualizar status do usuário', metadata.userId, error);
	} else {
		console.info('[MercadoPago webhook] Status do usuário atualizado para', novoStatus);
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const topic = url.searchParams.get('topic') ?? url.searchParams.get('type');
	const paymentId = url.searchParams.get('data.id') ?? url.searchParams.get('id');

	await processarNotificacao(topic, paymentId);

	return new Response('OK');
};

function mapearStatusUsuario(statusPagamento: string) {
	const statusNormalizado = statusPagamento.trim().toLowerCase();
	switch (statusNormalizado) {
		case 'approved':
			return 'ativo';
		case 'pending':
		case 'in_process':
			return 'pendente';
		case 'rejected':
			return 'suspenso';
		case 'cancelled':
		case 'cancelled_by_collector':
			return 'cancelado';
		case 'refunded':
		case 'charged_back':
			return 'reembolso';
		default:
			return statusNormalizado;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	let body: any = null;
	try {
		body = await request.json();
	} catch {
		// Mercado Pago envia algumas notificações sem corpo (URL apenas)
	}

	const topic = body?.topic ?? body?.type ?? null;
	const paymentId = body?.data?.id ?? body?.id ?? null;

	await processarNotificacao(topic, paymentId);

	return new Response('OK');
};
