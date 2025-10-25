import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { redirect } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';

export const load: PageServerLoad = async ({ locals }) => {
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

  try {
    // Buscar dados dos usuários
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email, whatsapp, status, data_cadastro')
      .order('data_cadastro', { ascending: false });

    if (usuariosError) {
      console.error('Erro ao buscar usuários:', usuariosError);
    }

    // Buscar estatísticas de simulados
    const { count: totalSimulados } = await supabaseAdmin
      .from('simulados_respostas')
      .select('*', { count: 'exact', head: true });

    return {
      usuarios: usuarios || [],
      estatisticas: {
        totalUsuarios: usuarios?.length || 0,
        totalSimulados: totalSimulados || 0,
        usuariosAtivos: usuarios?.filter(u => u.status === 'ativo').length || 0
      }
    };
  } catch (error) {
    console.error('Erro no servidor admin:', error);
    return {
      usuarios: [],
      estatisticas: {
        totalUsuarios: 0,
        totalSimulados: 0,
        usuariosAtivos: 0
      }
    };
  }
};