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

async function testarFluxoLogin() {
  console.log('🔍 Testando fluxo completo de login admin...\n');
  
  try {
    // 1. Limpar sessão atual
    console.log('1️⃣ Limpando sessão atual...');
    await supabase.auth.signOut();
    console.log('✅ Sessão limpa');
    
    // 2. Fazer login
    console.log('\n2️⃣ Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'frpdias@icloud.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }
    
    console.log('✅ Login bem-sucedido');
    console.log('🔑 Access Token:', authData.session?.access_token ? 'Presente' : 'Ausente');
    console.log('👤 User ID:', authData.user?.id);
    console.log('📧 Email:', authData.user?.email);
    
    // 3. Verificar sessão
    console.log('\n3️⃣ Verificando sessão...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
      return;
    }
    
    if (sessionData.session) {
      console.log('✅ Sessão ativa');
      console.log('⏰ Expira em:', new Date(sessionData.session.expires_at * 1000));
    } else {
      console.log('❌ Nenhuma sessão ativa');
    }
    
    // 4. Simular verificação de admin
    console.log('\n4️⃣ Simulando verificação de admin...');
    const user = authData.user;
    const email = user?.email?.toLowerCase() ?? '';
    const adminEmails = ['frpdias@icloud.com'];
    const autorizado = adminEmails.includes(email);
    
    console.log(`📋 Email: ${email}`);
    console.log(`✅ Autorizado: ${autorizado}`);
    
    // 5. Verificar metadata
    console.log('\n5️⃣ Verificando metadata do usuário...');
    console.log('🔧 App metadata:', user?.app_metadata);
    console.log('👤 User metadata:', user?.user_metadata);
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testarFluxoLogin();