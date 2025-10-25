import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Rate limiting - mapa para controlar tentativas por IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const RATE_LIMITS = {
  AUTH: 5, // 5 tentativas de login por 15 min
  API: 100, // 100 requests por minuto
  PAYMENT: 3 // 3 tentativas de pagamento por 5 min
} as const;

export const RATE_LIMIT_WINDOWS = {
  AUTH: 15 * 60 * 1000, // 15 minutos
  API: 60 * 1000, // 1 minuto  
  PAYMENT: 5 * 60 * 1000 // 5 minutos
} as const;

/**
 * Aplica rate limiting baseado no IP do cliente
 */
export function checkRateLimit(
  request: Request,
  type: keyof typeof RATE_LIMITS,
  customIP?: string
): boolean {
  const clientIP = getClientIP(request, customIP);
  const key = `${type}:${clientIP}`;
  const now = Date.now();
  
  const limit = RATE_LIMITS[type];
  const window = RATE_LIMIT_WINDOWS[type];
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Nova janela de tempo
    rateLimitMap.set(key, { count: 1, resetTime: now + window });
    return true;
  }
  
  if (current.count >= limit) {
    return false; // Rate limit excedido
  }
  
  current.count++;
  return true;
}

/**
 * Extrai o IP real do cliente, considerando proxies
 */
export function getClientIP(request: Request, fallback?: string): string {
  // Headers comuns de proxies/CDNs
  const headers = request.headers;
  
  return (
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() || // Proxies
    headers.get('x-real-ip') || // Nginx
    headers.get('x-client-ip') ||
    fallback ||
    'unknown'
  );
}

/**
 * Sanitiza entrada de texto para prevenir XSS
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
}

/**
 * Valida se o email tem formato válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida se a senha atende aos critérios mínimos
 */
export function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) && // Pelo menos uma maiúscula
    /[a-z]/.test(password) && // Pelo menos uma minúscula
    /\d/.test(password) // Pelo menos um número
  );
}

/**
 * Gera token CSRF para proteção de formulários
 */
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken && token.length > 0;
}

/**
 * Middleware de segurança para endpoints críticos
 */
export function securityMiddleware(event: RequestEvent, type: keyof typeof RATE_LIMITS = 'API') {
  // Rate limiting
  if (!checkRateLimit(event.request, type)) {
    throw error(429, 'Muitas tentativas. Tente novamente mais tarde.');
  }
  
  // Verificar Content-Type para requests POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(event.request.method)) {
    const contentType = event.request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw error(400, 'Content-Type inválido');
    }
  }
  
  return true;
}

/**
 * Log de segurança para atividades suspeitas
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  request?: Request
) {
  const timestamp = new Date().toISOString();
  const clientIP = request ? getClientIP(request) : 'unknown';
  
  const logEntry = {
    timestamp,
    event,
    clientIP,
    userAgent: request?.headers.get('user-agent') || 'unknown',
    ...details
  };
  
  // Em produção, enviar para serviço de logging
  if (env.NODE_ENV === 'production') {
    console.warn('[SECURITY]', JSON.stringify(logEntry));
  } else {
    console.log('[SECURITY]', logEntry);
  }
}

/**
 * Headers de segurança para responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.mercadopago.com https://vercel.live https://*.vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://vercel.live https://*.vercel.live",
      "frame-src https://www.mercadopago.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ')
  };
}