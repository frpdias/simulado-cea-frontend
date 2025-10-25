#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAdmin() {
  console.log('🔍 Diagnosticando erro 500 do admin...\n');
  
  try {
    // 1. Testar autenticação
    console.log('1️⃣ Testando autenticação...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'frpdias@icloud.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError);
      return;
    }
    
    console.log('✅ Autenticação OK');
    const user = authData.user;
    console.log('👤 User ID:', user.id);
    console.log('📧 Email:', user.email);
    
    // 2. Verificar se existe tabela usuarios
    console.log('\n2️⃣ Verificando tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(5);
      
    if (usuariosError) {
      console.error('❌ Erro ao acessar tabela usuarios:', usuariosError);
    } else {
      console.log('✅ Tabela usuarios acessível');
      console.log('📊 Colunas disponíveis:', Object.keys(usuarios[0] || {}));
      console.log('📋 Dados:', usuarios);
    }
    
    // 3. Verificar usuário específico
    console.log('\n3️⃣ Verificando usuário na tabela...');
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('papel')
      .eq('id', user.id)
      .maybeSingle();
      
    if (perfilError) {
      console.error('❌ Erro ao buscar perfil:', perfilError);
    } else {
      console.log('✅ Consulta perfil OK');
      console.log('👤 Perfil encontrado:', perfil);
    }
    
    // 4. Verificar metadata do usuário
    console.log('\n4️⃣ Verificando metadata...');
    console.log('🔧 App metadata:', user.app_metadata);
    console.log('👤 User metadata:', user.user_metadata);
    
    // 5. Simular validação de admin
    console.log('\n5️⃣ Simulando validação de admin...');
    const adminEmails = ['frpdias@icloud.com'];
    const email = user.email?.toLowerCase() ?? '';
    const autorizado = adminEmails.includes(email);
    console.log(`📋 Email autorizado: ${autorizado}`);
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

debugAdmin();