import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  
  if (!session) {
    throw redirect(303, '/admin-login');
  }
  
  const email = session.user.email?.toLowerCase();
  const isAdmin = email === 'frpdias@icloud.com';
  
  if (!isAdmin) {
    throw redirect(303, '/');
  }
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      nome: session.user.user_metadata?.nome || 'Admin'
    }
  };
};
