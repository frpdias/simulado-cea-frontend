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

async function simulateAdminLoad() {
  console.log('🔍 Simulando função load do layout admin...\n');
  
  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'frpdias@icloud.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }
    
    console.log('✅ Login bem-sucedido');
    
    // 2. Simular a função getSession
    console.log('\n2️⃣ Simulando getSession...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
      return;
    }
    
    const session = sessionData.session;
    console.log('✅ Sessão obtida:', {
      exists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at
    });
    
    // 3. Simular verificação de autorização
    if (!session) {
      console.log('❌ Sem sessão - redirecionaria para login');
      return;
    }
    
    const user = session.user;
    const email = user.email?.toLowerCase() ?? '';
    
    console.log('\n3️⃣ Verificando autorização...');
    console.log('👤 User:', {
      id: user.id,
      email: email,
      metadata: user.user_metadata
    });
    
    // Verificação simples por email
    const adminEmails = ['frpdias@icloud.com'];
    const autorizado = adminEmails.includes(email);
    
    console.log('✅ Autorizado:', autorizado);
    
    if (!autorizado) {
      console.log('❌ Não autorizado - erro 403');
      return;
    }
    
    console.log('\n4️⃣ Simulação de retorno...');
    const result = {
      supabase,
      adminUser: {
        id: user.id,
        email: user.email,
        nome: user.user_metadata?.nome ?? user.email
      }
    };
    
    console.log('✅ Retorno simulado:', {
      adminUser: result.adminUser,
      supabaseExists: !!result.supabase
    });
    
  } catch (error) {
    console.error('💥 Erro na simulação:', error);
  }
}

simulateAdminLoad();