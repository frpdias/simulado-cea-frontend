import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const supabaseUrl = 'https://zcrzyhdzjanivracmoub.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjcnp5aGR6amFuaXZyYWNtb3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI0NTA5MSwiZXhwIjoyMDczODIxMDkxfQ.T4VNBfbCClcJbhxFvEBXTFsRyZUqVtQIlnHaYVlDVao';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storageKey: 'supabase.auth.token.api'
  }
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('API Cadastro chamada');
    const body = await request.json();
    console.log('Body recebido:', { ...body, senha: '[OCULTO]' });
    
    const { nome, email, whatsapp, senha } = body;

    // Validações básicas
    if (!nome || !email || !whatsapp || !senha) {
      return json({ 
        success: false, 
        error: 'Todos os campos são obrigatórios' 
      }, { status: 400 });
    }

    console.log('Tentando criar usuário no Supabase Auth...');
    // Criar usuário no auth usando admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true
    });

    if (authError) {
      console.error('Erro no Supabase Auth:', authError);
      return json({ 
        success: false, 
        error: authError.message || 'Erro ao criar usuário no auth'
      }, { status: 400 });
    }

    console.log('Usuário criado no Auth, inserindo na tabela usuarios...');
    if (authData.user) {
      // Inserir dados na tabela usuarios
      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nome,
          email,
          whatsapp,
          status: 'ativo',
          data_cadastro: new Date().toISOString()
        });

      if (dbError) {
        console.error('Erro ao inserir na tabela usuarios:', dbError);
        // Se falhou para criar na tabela, deletar do auth
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return json({ 
          success: false, 
          error: dbError.message || 'Erro ao inserir usuário na base de dados'
        }, { status: 400 });
      }

      console.log('Usuário criado com sucesso!');
      return json({ 
        success: true, 
        message: 'Usuário criado com sucesso!',
        user: { id: authData.user.id, email: authData.user.email }
      });
    }

    return json({ 
      success: false, 
      error: 'Falha ao criar usuário - authData.user não existe'
    }, { status: 500 });

  } catch (error: any) {
    console.error('Erro no servidor:', error);
    return json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
};
