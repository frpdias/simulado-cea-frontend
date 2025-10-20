# Simulado CEA - Frontend

Este projeto utiliza SvelteKit e Supabase para autenticação e dados.

## Variáveis de ambiente

1. Duplique o arquivo `.env.example` para `.env`.
2. Ajuste as variáveis se necessário (os valores padrão apontam para o projeto Supabase público).
3. Adicione `SUPABASE_SERVICE_ROLE_KEY` com a chave **service role** do seu projeto Supabase (obrigatória para comandos administrativos como seeds).
4. Inclua as credenciais do Mercado Pago:
   - `MERCADOPAGO_PUBLIC_KEY`
   - `MERCADOPAGO_ACCESS_TOKEN`
   Ambas devem ser configuradas também no painel da Vercel para que os ambientes deployados funcionem corretamente.

## Scripts

- `npm run dev` — roda o projeto localmente
- `npm run build` — build para produção
- `npm run build:vercel` — build preparado para a infraestrutura do Vercel
- `npm run preview` — preview local do build de produção
- `npm run deploy:vercel` — executa o deploy usando o CLI do Vercel (requer login)
- `npm run seed:fakes` — insere usuário e resultados fake no Supabase (usa a service role)
- `npm run admin:ensure` — cria/atualiza o usuário administrador padrão `frpdias@icloud.com`

## Deploy

Recomenda-se deploy no Vercel:

1. Configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` no painel do projeto.
2. Autentique-se com `npx vercel login`.
3. Execute `npm run deploy:vercel` para enviar para produção (`npx vercel deploy --prod`).

### Notificações de pagamento

1. Aponte o webhook do Mercado Pago para `https://simulado-cea.vercel.app/api/pagamentos/webhook`.
2. As preferências são geradas via `POST /api/pagamentos/preferencias` (apenas para usuários autenticados).
3. Os pagamentos aprovados atualizam o `status` do usuário na tabela `usuarios` automaticamente.
4. Para registrar o histórico, crie a tabela `pagamentos` no Supabase:

```sql
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  payment_id text unique not null,
  user_id uuid not null references public.usuarios(id) on delete cascade,
  status text not null,
  status_detail text,
  valor numeric(12,2),
  moeda text,
  metodo text,
  tipo text,
  raw_data jsonb,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists pagamentos_user_id_idx on public.pagamentos(user_id);
```

### Monitoramento de logs

- Use `npx vercel logs simulado-cea --since 1h` para inspecionar notificações recentes do Mercado Pago.
- No painel da Vercel, abra *Deployments → Logs* e filtre pelo endpoint `/api/pagamentos/webhook` para confirmar as chamadas.

## Dados fake para o painel

1. Garanta que `SUPABASE_SERVICE_ROLE_KEY` esteja definido no `.env`.
2. Rode `npm run seed:fakes`.
3. Faça login com o usuário exibido no final do comando para visualizar os dados no painel de aproveitamento.
# Deploy trigger
