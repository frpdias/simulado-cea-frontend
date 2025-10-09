import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const supabaseUrl = 'https://zcrzyhdzjanivracmoub.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjcnp5aGR6amFuaXZyYWNtb3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI0NTA5MSwiZXhwIjoyMDczODIxMDkxfQ.T4VNBfbCClcJbhxFvEBXTFsRyZUqVtQIlnHaYVlDVao';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storageKey: 'supabase.auth.token.api'
  }
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { nome, email, whatsapp, senha } = await request.json();

    // Criar usuário no auth usando admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true
    });

    if (authError) throw authError;

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

      if (dbError) throw dbError;

      return json({ 
        success: true, 
        message: 'Usuário criado com sucesso!',
        user: authData.user 
      });
    }

    throw new Error('Falha ao criar usuário');
  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    return json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
};
