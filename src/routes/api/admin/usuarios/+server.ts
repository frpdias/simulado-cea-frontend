import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { requireAdminAuth } from '$lib/server/adminAuth';

export const PATCH = async ({ request, locals }: RequestEvent) => {
  try {
    const session = await locals.getSession();
    
    if (!session) {
      return json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário tem permissões de admin
    const isAdmin = await requireAdminAuth(session);
    
    if (!isAdmin) {
      return json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const { userId, action, status } = await request.json();

    if (!userId || !action) {
      return json({ success: false, error: 'Parâmetros obrigatórios não fornecidos' }, { status: 400 });
    }

    if (action === 'updateStatus') {
      if (!status || !['ativo', 'suspenso', 'inativo'].includes(status)) {
        return json({ success: false, error: 'Status inválido' }, { status: 400 });
      }

      // Atualizar status do usuário
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update({ 
          status: status,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Erro ao atualizar status do usuário:', error);
        return json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
      }

      // Se o usuário foi suspenso ou inativado, revogar sessões ativas
      if (status === 'suspenso' || status === 'inativo') {
        try {
          // Buscar o usuário para ter acesso ao email
          const { data: userData } = await supabaseAdmin
            .from('usuarios')
            .select('email')
            .eq('id', userId)
            .single();

          if (userData?.email) {
            // Buscar o usuário no auth do Supabase
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authUsers.users.find(u => u.email === userData.email);

            if (authUser) {
              // Revogar todas as sessões do usuário
              await supabaseAdmin.auth.admin.signOut(authUser.id, 'global');
            }
          }
        } catch (authError) {
          console.warn('Aviso: Não foi possível revogar sessões do usuário:', authError);
          // Não falha a operação se não conseguir revogar as sessões
        }
      }

      return json({ 
        success: true, 
        message: `Status do usuário atualizado para ${status}`,
        data: data?.[0]
      });
    }

    return json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de usuários:', error);
    return json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
};

export const DELETE = async ({ request, locals }: RequestEvent) => {
  try {
    const session = await locals.getSession();
    
    if (!session) {
      return json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário tem permissões de admin
    const isAdmin = await requireAdminAuth(session);
    
    if (!isAdmin) {
      return json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return json({ success: false, error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    // Buscar dados do usuário antes de excluir
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Excluir o usuário da tabela usuarios
    const { error: deleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Erro ao excluir usuário:', deleteError);
      return json({ success: false, error: 'Erro ao excluir usuário' }, { status: 500 });
    }

    // Tentar excluir o usuário do auth do Supabase também
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers.users.find(u => u.email === userData.email);

      if (authUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      }
    } catch (authError) {
      console.warn('Aviso: Não foi possível excluir usuário do auth:', authError);
      // Não falha a operação se não conseguir excluir do auth
    }

    return json({ 
      success: true, 
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
};