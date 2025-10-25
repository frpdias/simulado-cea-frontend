import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  
  if (!session) {
    throw redirect(303, '/admin-login');
  }
  
  // Verificar se o usuário tem permissões de admin
  const isAdmin = await requireAdminAuth(session);
  
  if (!isAdmin) {
    console.log(`🚫 Acesso negado ao admin para: ${session.user.email}`);
    throw redirect(303, '/login?error=acesso-negado');
  }
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      nome: session.user.user_metadata?.nome || 'Admin'
    }
  };
};
