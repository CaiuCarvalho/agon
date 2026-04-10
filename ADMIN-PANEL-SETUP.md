# Guia de Configuração do Painel Admin

Este guia explica como configurar e usar o painel administrativo do Agon.

## Pré-requisitos

1. Aplicar as migrações do banco de dados (ver `supabase/APPLY_ADMIN_PANEL_MIGRATIONS.md`)
2. Configurar variáveis de ambiente
3. Criar usuário admin no Supabase

## 1. Configuração de Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `apps/web/.env.local`:

```bash
# Backend (validação autoritativa)
ADMIN_EMAIL_PRIMARY=seu-email@example.com
ADMIN_EMAIL_BACKUP=email-backup@example.com

# Frontend (apenas UX, não é segurança)
NEXT_PUBLIC_ADMIN_EMAIL_PRIMARY=seu-email@example.com
NEXT_PUBLIC_ADMIN_EMAIL_BACKUP=email-backup@example.com
```

**Importante:**
- A validação de segurança real acontece no backend
- As variáveis `NEXT_PUBLIC_*` são apenas para melhorar a UX no frontend
- Nunca confie apenas na validação do frontend

## 2. Criar Usuário Admin no Supabase

### Opção A: Via SQL Editor (Recomendado)

Execute no SQL Editor do Supabase:

```sql
-- 1. Criar usuário (se ainda não existe)
-- Substitua 'seu-email@example.com' pelo email do admin
-- O usuário precisa fazer signup primeiro via interface

-- 2. Atualizar role para admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@example.com';

-- 3. Verificar
SELECT id, email, role 
FROM profiles 
WHERE email = 'seu-email@example.com';
```

### Opção B: Via Interface do Supabase

1. Acesse: Authentication → Users
2. Encontre o usuário
3. Clique em "Edit user"
4. Adicione metadata: `{ "role": "admin" }`

**Nota:** A opção A é preferível pois atualiza diretamente a tabela `profiles`.

## 3. Whitelist de Emails

O sistema usa uma whitelist de 2 emails para controle de acesso:

- **ADMIN_EMAIL_PRIMARY**: Email principal do administrador
- **ADMIN_EMAIL_BACKUP**: Email de backup (opcional)

### Segurança em 3 Camadas

1. **Backend Validation** (Primária)
   - Valida em TODOS os endpoints da API admin
   - Verifica: autenticação + role='admin' + email na whitelist
   - Retorna 401/403 se falhar

2. **RLS Policies** (Última Defesa)
   - Políticas no Supabase que verificam role='admin'
   - Retorna conjunto vazio se violado
   - Proteção adicional caso backend falhe

3. **Frontend Guard** (Apenas UX)
   - Redireciona usuários não-admin
   - Melhora experiência do usuário
   - **NÃO é segurança** - apenas conveniência

## 4. Acessar o Painel Admin

1. Faça login com uma conta admin
2. Acesse: `http://localhost:3000/admin`
3. Você verá o dashboard com:
   - Métricas de receita e pedidos
   - Gerenciamento de produtos
   - Gerenciamento de pedidos
   - Atualização de envios

## 5. Funcionalidades

### Dashboard (`/admin`)
- Receita total
- Contagem de pedidos por status
- Valor médio do pedido
- 10 pedidos mais recentes

### Produtos (`/admin/products`)
- Listar todos os produtos (incluindo deletados)
- Criar novo produto
- Editar produto existente
- Atualizar estoque inline
- Soft delete/restaurar produto
- Paginação (20 por página)

### Pedidos (`/admin/orders`)
- Listar pedidos com paginação
- Filtrar por status de pagamento
- Filtrar por status de envio
- Ver detalhes do pedido (expandir linha)
- Atualizar informações de envio
- Adicionar código de rastreamento

### Fulfillment (Envio)
- Atualizar status de envio
- Adicionar transportadora e código de rastreamento
- Validações de negócio:
  - Pagamento deve estar aprovado
  - Status não pode regredir
  - Tracking obrigatório para "enviado"

## 6. Regras de Negócio

### Status de Pedido (Derivado)
O status do pedido é **derivado automaticamente** pelo banco de dados:
- Baseado em: status de pagamento + status de envio
- Atualizado por trigger quando qualquer um muda
- **NUNCA** derive manualmente no código da aplicação

### Progressão de Status de Envio
```
pending → processing → shipped → delivered
```
- Não pode regredir (ex: shipped → processing é inválido)
- Validado no backend

### Requisitos de Rastreamento
- Status "shipped" ou "delivered" requer:
  - Código de rastreamento
  - Nome da transportadora
- Validado no backend e frontend

## 7. Testes

Siga o guia em `ADMIN-PANEL-TESTING-GUIDE.md` para testar:
- Autenticação e autorização
- CRUD de produtos
- Visualização de pedidos
- Atualização de envios
- Validações de negócio

## 8. Troubleshooting

### "Acesso negado" ao tentar acessar /admin

**Verifique:**
1. Usuário está autenticado?
2. Role do usuário é 'admin'?
   ```sql
   SELECT role FROM profiles WHERE email = 'seu-email@example.com';
   ```
3. Email está na whitelist (.env.local)?
4. Reiniciou o servidor após alterar .env.local?

### Não consigo atualizar envio

**Verifique:**
1. Pagamento está aprovado?
2. Status de envio não está regredindo?
3. Código de rastreamento e transportadora fornecidos (se status = shipped)?

### Webhook não está atualizando status

**Verifique:**
1. Migrations aplicadas?
2. RPC function `update_payment_from_webhook` existe?
3. Trigger `update_order_status_on_shipping_change` existe?
4. Logs do webhook no console

## 9. Produção

Antes de fazer deploy:

1. **Atualizar variáveis de ambiente**
   ```bash
   ADMIN_EMAIL_PRIMARY=admin-producao@empresa.com
   ADMIN_EMAIL_BACKUP=backup-producao@empresa.com
   NEXT_PUBLIC_ADMIN_EMAIL_PRIMARY=admin-producao@empresa.com
   NEXT_PUBLIC_ADMIN_EMAIL_BACKUP=backup-producao@empresa.com
   ```

2. **Criar usuários admin em produção**
   - Execute o SQL no banco de produção
   - Verifique que role='admin' está definido

3. **Testar acesso**
   - Faça login com conta admin
   - Verifique que não-admins são bloqueados
   - Teste todas as funcionalidades

4. **Monitorar logs**
   - Falhas de autenticação admin são logadas
   - Webhook events são logados com correlation_id

## 10. Segurança

### Boas Práticas

✅ **FAÇA:**
- Use emails corporativos para admins
- Mantenha whitelist atualizada
- Monitore logs de acesso admin
- Use HTTPS em produção
- Rotacione credenciais periodicamente

❌ **NÃO FAÇA:**
- Não confie apenas no frontend guard
- Não adicione muitos emails à whitelist
- Não compartilhe credenciais admin
- Não desabilite validação backend
- Não exponha SUPABASE_SERVICE_ROLE_KEY

### Auditoria

Todos os acessos admin falhados são logados com:
- Timestamp
- Email do usuário
- Endpoint tentado
- Motivo da falha

Revise esses logs regularmente para detectar tentativas de acesso não autorizado.

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do servidor
2. Consulte `ADMIN-PANEL-TESTING-GUIDE.md`
3. Revise as migrations em `supabase/migrations/`
4. Verifique o design em `.kiro/specs/admin-panel-mvp/design.md`
