#!/usr/bin/env python3
"""
Script para auditoria de segurança do banco de dados Supabase
Verifica políticas RLS, permissões e configurações de segurança
"""

import os
import sys
from supabase import create_client

def main():
    # Usar variáveis de ambiente
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ ERRO: Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY")
        sys.exit(1)
    
    supabase = create_client(url, key)
    
    print("🔍 AUDITORIA DE SEGURANÇA DO BANCO DE DADOS")
    print("=" * 50)
    
    # Verificar estrutura das tabelas principais
    tables_to_check = [
        'questoes',
        'usuarios', 
        'simulados_respostas',
        'pagamentos'
    ]
    
    for table in tables_to_check:
        print(f"\n📋 Tabela: {table}")
        try:
            # Tentar fazer uma query simples para testar acesso
            result = supabase.table(table).select("*").limit(1).execute()
            print(f"✅ Acesso permitido - {len(result.data)} registros encontrados")
            
            # Verificar se RLS está habilitado (apenas com service role)
            if "SERVICE_ROLE" in key.upper():
                rls_query = f"""
                SELECT schemaname, tablename, rowsecurity 
                FROM pg_tables 
                WHERE tablename = '{table}' AND schemaname = 'public'
                """
                rls_result = supabase.rpc('exec_sql', {'sql': rls_query}).execute()
                print(f"🔒 RLS Status: {rls_result.data}")
                
        except Exception as e:
            print(f"❌ Erro ao acessar tabela: {e}")
    
    print("\n🛡️  RECOMENDAÇÕES DE SEGURANÇA:")
    print("1. ✅ Credenciais removidas do código")
    print("2. ⚠️  Verificar se RLS está habilitado em todas as tabelas")
    print("3. ⚠️  Implementar políticas específicas para cada role")
    print("4. ⚠️  Auditoria de permissões de storage bucket")
    print("5. ⚠️  Habilitar logging de auditoria")

if __name__ == "__main__":
    main()