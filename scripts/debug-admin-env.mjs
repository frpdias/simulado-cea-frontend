#!/usr/bin/env node

/**
 * Script para debugar variáveis de ambiente do admin
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local se existir
dotenv.config({ path: join(__dirname, '..', '.env.local') });

console.log('🔍 Verificando configurações do admin...\n');

// Verificar variáveis de ambiente críticas
const vars = {
  'ADMIN_ALLOWED_EMAILS': process.env.ADMIN_ALLOWED_EMAILS,
  'PUBLIC_SUPABASE_URL': process.env.PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? '[DEFINIDA]' : undefined,
  'NODE_ENV': process.env.NODE_ENV
};

console.log('📋 Variáveis de ambiente:');
for (const [key, value] of Object.entries(vars)) {
  console.log(`  ${key}: ${value || '[NÃO DEFINIDA]'}`);
}

// Verificar se o Supabase está acessível
if (process.env.PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    console.log('\n🔌 Testando conexão com Supabase...');
    const supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (error) {
      console.log('❌ Erro ao conectar com Supabase:', error.message);
    } else {
      console.log('✅ Conexão com Supabase OK');
    }
  } catch (err) {
    console.log('❌ Erro na conexão:', err.message);
  }
} else {
  console.log('\n⚠️  Não foi possível testar Supabase (variáveis faltando)');
}

// Verificar formato do ADMIN_ALLOWED_EMAILS
if (process.env.ADMIN_ALLOWED_EMAILS) {
  const emails = process.env.ADMIN_ALLOWED_EMAILS
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
    
  console.log('\n📧 Emails de admin configurados:');
  emails.forEach(email => console.log(`  - ${email}`));
  
  if (emails.length === 0) {
    console.log('⚠️  ADMIN_ALLOWED_EMAILS está vazio após processamento!');
  }
} else {
  console.log('\n❌ ADMIN_ALLOWED_EMAILS não está definido!');
}

console.log('\n🔧 Para configurar no Vercel:');
console.log('vercel env add ADMIN_ALLOWED_EMAILS');
console.log('Digite: frpdias@icloud.com');