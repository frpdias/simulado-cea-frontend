# 🛡️ Guia de Administração - Simulado CEA

## ✅ **PROBLEMA RESOLVIDO: Login Admin Funcionando**

### 📋 **Credenciais de Acesso Admin**
- **Email**: `frpdias@icloud.com`
- **Senha**: `123456`
- **URL de Login**: `/admin-login`
- **Painel Admin**: `/admin`

### 🔧 **Problema Identificado e Solucionado**

#### **Causa Raiz:**
A variável de ambiente `ADMIN_ALLOWED_EMAILS` no Vercel estava configurada com o email errado (`frpdias@hotmail.com`) enquanto o usuário real no banco de dados era `frpdias@icloud.com`.

#### **Solução Aplicada:**
1. ✅ Identificado email correto através de diagnóstico
2. ✅ Atualizado `ADMIN_ALLOWED_EMAILS` no Vercel
3. ✅ Redeploy realizado com configuração correta

### 🔍 **Processo de Diagnóstico Realizado**

#### **1. Verificação de Autenticação**
```bash
# Script de teste de login
node scripts/test-admin-login.mjs
```
**Resultado**: ✅ Login funcionando localmente

#### **2. Análise de Configuração**
```bash
# Verificação das variáveis de ambiente
grep ADMIN_ALLOWED_EMAILS .env.vercel.production
```
**Resultado**: ❌ Email incorreto em produção

#### **3. Diagnóstico Completo**
```bash
# Teste de múltiplas combinações
node scripts/diagnostico-admin.mjs
```
**Resultado**: ✅ Identificado email/senha corretos

### ⚙️ **Configuração de Administradores**

#### **Variáveis de Ambiente Necessárias**
```bash
# No Vercel (Produção)
ADMIN_ALLOWED_EMAILS=frpdias@icloud.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Local (.env)
ADMIN_ALLOWED_EMAILS=frpdias@icloud.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### **Validação de Admin (3 Métodos)**
O sistema verifica se um usuário é admin através de:

1. **Lista de Emails** (`ADMIN_ALLOWED_EMAILS`)
2. **User Metadata** (`user_metadata.role = 'admin'`)
3. **Tabela Usuarios** (`usuarios.papel = 'admin'`)

### 🛠️ **Scripts de Administração**

#### **1. Garantir Usuário Admin**
```bash
node scripts/ensure-admin.mjs
```
- Cria ou atualiza usuário administrador
- Define metadata de admin
- Insere na tabela usuarios

#### **2. Testar Login Admin**
```bash
node scripts/test-admin-login.mjs
```
- Testa credenciais de admin
- Verifica role e permissions
- Valida metadata

#### **3. Diagnóstico Completo**
```bash
node scripts/diagnostico-admin.mjs
```
- Testa múltiplas combinações
- Identifica problemas de configuração
- Fornece soluções específicas

### 🚀 **URLs de Acesso Admin**

#### **Produção**
- **Login**: https://simulado-5ih1bs77u-fernando-dias-projects-e4b4044b.vercel.app/admin-login
- **Painel**: https://simulado-5ih1bs77u-fernando-dias-projects-e4b4044b.vercel.app/admin

#### **Local**
- **Login**: http://localhost:5173/admin-login
- **Painel**: http://localhost:5173/admin

### 🔐 **Funcionalidades do Painel Admin**

#### **Acesso Atual**
- ✅ Login protegido com autenticação
- ✅ Validação de permissões
- ✅ Redirecionamento automático
- ✅ Logout seguro

#### **Recursos Disponíveis** (conforme implementado)
- 📊 Dashboard administrativo
- 👥 Gestão de usuários
- 📝 Gestão de questões/simulados
- 📈 Relatórios e estatísticas

### ⚠️ **Troubleshooting Admin**

#### **Se o login não funcionar:**

1. **Verificar Email/Senha**
   ```bash
   node scripts/diagnostico-admin.mjs
   ```

2. **Verificar Variáveis de Ambiente**
   ```bash
   npx vercel env ls
   ```

3. **Recriar Usuário Admin**
   ```bash
   node scripts/ensure-admin.mjs
   ```

4. **Verificar Logs do Sistema**
   - Acessar Vercel Dashboard
   - Verificar Function Logs
   - Verificar erros de autenticação

#### **Problemas Comuns e Soluções**

| Problema | Causa | Solução |
|----------|-------|---------|
| "Email não autorizado" | `ADMIN_ALLOWED_EMAILS` incorreto | Atualizar no Vercel |
| "Credenciais inválidas" | Senha incorreta | Executar `ensure-admin.mjs` |
| "Acesso negado" | Falta role admin | Verificar metadata do usuário |
| "Erro 500" | `SERVICE_ROLE_KEY` inválida | Verificar chave no Supabase |

### 📞 **Suporte e Manutenção**

#### **Para Adicionar Novos Admins:**
1. Atualizar `ADMIN_ALLOWED_EMAILS` no Vercel
2. Ou executar script para definir role no usuário
3. Redeploy da aplicação

#### **Para Alterar Senha Admin:**
```bash
# Editar o arquivo scripts/ensure-admin.mjs
# Alterar a variável ADMIN_USER.password
# Executar: node scripts/ensure-admin.mjs
```

---

## ✅ **STATUS ATUAL: SISTEMA ADMIN TOTALMENTE FUNCIONAL**

- 🔐 **Login**: Funcionando
- 🛡️ **Segurança**: Implementada
- 📊 **Painel**: Acessível
- 🔧 **Scripts**: Funcionais
- 📝 **Documentação**: Completa