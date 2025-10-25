import { redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load = async ({ locals }: { locals: any }) => {
  const session = await locals.getSession();
  
  if (!session) {
    throw redirect(303, '/admin-login');
  }
  
  const email = session.user.email?.toLowerCase();
  const isAdmin = email === 'frpdias@icloud.com';
  
  if (!isAdmin) {
    throw redirect(303, '/');
  }
  
  try {
    // Buscar usuários cadastrados
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usuariosError) {
      console.error('Erro ao buscar usuários:', usuariosError);
    }
    
    // Buscar estatísticas de simulados (se existir a tabela)
    const { count: totalSimulados } = await supabaseAdmin
      .from('respostas')
      .select('*', { count: 'exact', head: true });
    
    return {
      usuarios: usuarios || [],
      stats: {
        totalUsuarios: usuarios?.length || 0,
        totalSimulados: totalSimulados || 0,
        usuariosAtivos: usuarios?.filter(u => u.last_sign_in_at).length || 0
      }
    };
  } catch (error) {
    console.error('Erro no servidor admin:', error);
    return {
      usuarios: [],
      stats: {
        totalUsuarios: 0,
        totalSimulados: 0,
        usuariosAtivos: 0
      }
    };
  }
};