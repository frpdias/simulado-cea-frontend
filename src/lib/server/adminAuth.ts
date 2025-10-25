import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { User } from '@supabase/supabase-js';

/**
 * Lista de emails autorizados a acessar o painel admin
 * Configurada via variável de ambiente ADMIN_ALLOWED_EMAILS
 */
function getAdminEmails(): string[] {
  const adminEmailsEnv = env.ADMIN_ALLOWED_EMAILS || '';
  return adminEmailsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifica se um usuário tem permissões de administrador
 */
export async function isUserAdmin(user: User): Promise<boolean> {
  if (!user || !user.email) {
    return false;
  }

  const userEmail = user.email.toLowerCase();
  const adminEmails = getAdminEmails();
  
  // Se não há emails admin configurados, negar acesso por segurança
  if (adminEmails.length === 0) {
    console.warn('⚠️ ADMIN_ALLOWED_EMAILS não configurado. Acesso admin negado.');
    return false;
  }

  // Verificar se o email está na lista de admins
  const isEmailAuthorized = adminEmails.includes(userEmail);
  
  if (!isEmailAuthorized) {
    console.log(`🚫 Email ${userEmail} não autorizado para admin. Emails permitidos: ${adminEmails.join(', ')}`);
    return false;
  }

  // Verificação adicional: confirmar que o usuário existe no banco
  try {
    const { data: userData, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, status')
      .eq('email', userEmail)
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar usuário admin no banco:', error);
      return false;
    }

    if (!userData) {
      console.log(`🚫 Usuário admin ${userEmail} não encontrado no banco de dados`);
      return false;
    }

    if (userData.status !== 'ativo') {
      console.log(`🚫 Usuário admin ${userEmail} não está ativo. Status: ${userData.status}`);
      return false;
    }

    console.log(`✅ Acesso admin autorizado para ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Erro ao verificar permissões admin:', error);
    return false;
  }
}

/**
 * Middleware para rotas admin - verifica autenticação e autorização
 */
export async function requireAdminAuth(session: any): Promise<boolean> {
  if (!session || !session.user) {
    return false;
  }

  return await isUserAdmin(session.user);
}

/**
 * Lista os emails admin configurados (para debug/logs)
 */
export function getConfiguredAdminEmails(): string[] {
  return getAdminEmails();
}