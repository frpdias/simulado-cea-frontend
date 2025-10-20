import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mercadoPagoPreference } from '$lib/server/mercadoPago';
import { env } from '$env/dynamic/private';

interface CriarPreferenciaPayload {
	title?: string;
	description?: string;
	price?: number;
	quantity?: number;
	externalReference?: string;
	successUrl?: string;
	failureUrl?: string;
	pendingUrl?: string;
	metadata?: Record<string, unknown>;
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const session = await locals.getSession();

	if (!session) {
		throw error(401, 'Faça login para gerar um pagamento.');
	}

	let payload: CriarPreferenciaPayload;
	try {
		payload = (await request.json()) ?? {};
	} catch {
		throw error(400, 'JSON inválido no corpo da requisição.');
	}

	const title = payload.title?.trim() || 'Acesso Simulado CEA';

	const priceNumber = Number.isFinite(Number(payload.price))
		? Number(payload.price)
		: 29.9;

	if (priceNumber <= 0) {
		throw error(400, 'Valor inválido.');
	}

	const quantity = 1;

	const baseUrl = url.origin;
	const successUrl = payload.successUrl ?? `${baseUrl}/pagamento/sucesso`;
	const failureUrl = payload.failureUrl ?? `${baseUrl}/pagamento/erro`;
	const pendingUrl = payload.pendingUrl ?? `${baseUrl}/pagamento/pendente`;

	const metadata = {
		userId: session.user.id,
		email: session.user.email ?? undefined,
		...(payload.metadata ?? {})
	};

	let preference;
	try {
		preference = await mercadoPagoPreference.create({
			body: {
				binary_mode: true,
				items: [
					{
						id: 'simulado-cea-access',
						title,
						description: payload.description?.slice(0, 256),
						quantity,
						unit_price: Number(priceNumber)
					}
				],
				payment_methods: {
					excluded_payment_types: [
						{ id: 'credit_card' },
						{ id: 'debit_card' },
						{ id: 'ticket' },
						{ id: 'atm' },
						{ id: 'bank_transfer' }
					]
				},
				payer: {
					email: session.user.email ?? undefined,
					name: (session.user.user_metadata?.nome as string | undefined) ?? undefined
				},
				back_urls: {
					success: successUrl,
					failure: failureUrl,
					pending: pendingUrl
				},
				auto_return: 'approved',
				external_reference: payload.externalReference ?? undefined,
				metadata: {
					...metadata,
					value: Number(priceNumber),
					paymentMethod: 'pix'
				}
			}
		});
	} catch (err: any) {
		console.error('[MercadoPago] Erro ao criar preferência PIX', err);
		throw error(502, err?.message ?? 'Não foi possível criar a cobrança.');
	}

	return json({
		preference_id: preference.id,
		init_point: preference.init_point,
		sandbox_init_point: preference.sandbox_init_point,
		public_key: env.MERCADOPAGO_PUBLIC_KEY ?? null
	});
};
