import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const supabaseUrl = 'https://zcrzyhdzjanivracmoub.supabase.co'\;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjcnp5aGR6amFuaXZyYWNtb3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI0NTA5MSwiZXhwIjoyMDczODIxMDkxfQ.T4VNBfbCClcJbhxFvEBXTFsRyZUqVtQIlnHaYVlDVao';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storageKey: 'supabase.auth.token.api'
  }
});

export const POST: RequestHandler = async ({ request }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    console.log('API Cadastro chamada');
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      return json({ 
        success: false, 
        error: 'Dados inválidos - JSON malformado' 
      }, { status: 400, headers });
    }
    
    console.log('Body recebido:', { ...body, senha: '[OCULTO]' });
    
    const { nome, email, whatsapp, senha } = body;

    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      return json({ 
        success: false, 
        error: 'Nome é obrigatório e deve ter pelo menos 2 caracteres' 
      }, { status: 400, headers });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return json({ 
        success: false, 
        error: 'Email inválido' 
      }, { status: 400, headers });
    }

    if (!whatsapp || typeof whatsapp !== 'string' || whatsapp.trim().length < 10) {
      return json({ 
        success: false, 
        error: 'WhatsApp deve ter pelo menos 10 dígitos' 
      }, { status: 400, headers });
    }

    if (!senha || typeof senha !== 'string' || senha.length < 6) {
      return json({ 
        success: false, 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      }, { status: 400, headers });
    }

    console.log('Validações passaram, tentando criar usuário no Supabase Auth...');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: senha,
      email_confirm: true
    });

    if (authError) {
      console.error('Erro no Supabase Auth:', authError);
      return json({ 
        success: false, 
        error: authError.message || 'Erro ao criar usuário no auth'
      }, { status: 400, headers });
    }

    console.log('Usuário criado no Auth, inserindo na tabela usuarios...');
    
    if (authData.user) {
      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          whatsapp: whatsapp.trim(),
          status: 'ativo',
          data_cadastro: new Date().toISOString()
        });

      if (dbError) {
        console.error('Erro ao inserir na tabela usuarios:', dbError);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return json({ 
          success: false, 
          error: dbError.message || 'Erro ao inserir usuário na base de dados'
        }, { status: 400, headers });
      }

      console.log('Usuário criado com sucesso!');
      return json({ 
        success: true, 
        message: 'Usuário criado com sucesso!',
        user: { id: authData.user.id, email: authData.user.email }
      }, { headers });
    }

    return json({ 
      success: false, 
      error: 'Falha ao criar usuário - authData.user não existe'
    }, { status: 500, headers });

  } catch (error: any) {
    console.error('Erro no servidor:', error);
    return json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor'
    }, { status: 500, headers });
  }
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
