import { env } from '$env/dynamic/private';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
	throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado. Defina no ambiente antes de usar a API.');
}

const mercadoPagoClient = new MercadoPagoConfig({
	accessToken
});

export const mercadoPagoPreference = new Preference(mercadoPagoClient);
export const mercadoPagoPayment = new Payment(mercadoPagoClient);
