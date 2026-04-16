# Changelog - Agon E-commerce

Histórico de mudanças e features implementadas.

## [2026-04-16] — Cleanup & Security

### 🧹 Código Morto Removido
- Removido `apps/web/src/lib/api.ts` (74 linhas, zero imports, referenciava `vitta_token` de projeto anterior)
- Removido `formatCurrency` quebrado (`$${val}`) de `lib/utils.ts` e tipos `ProductDTO | UserProfile | ShippingAddress = any`
- Criado `lib/format.ts` com `formatBRL` canônico (`Intl.NumberFormat('pt-BR', { currency: 'BRL' })`)
- Consolidados 5+ `formatCurrency` duplicados locais para usar `formatBRL`
- Removido branch morto `if (rpcError)` em `api/checkout/create-order/route.ts`
- Alinhado `MAX_ITEMS` da Wishlist (20 → 50, batendo com contracts/DB trigger)
- Substituídos usos de tipos `any` em `Navbar`, `QuickSearch`, `AddressSelector`, `PersonalDataForm` por interfaces reais

### 🔒 Segurança
- `middleware.ts`: removido `as any` em `Promise.race` + adicionado `clearTimeout` no `finally` para evitar timer vazado
- `payment/mercadoPagoService.ts`: phone parsing agora lança erro explícito em vez de silenciar (defesa em profundidade)
- `admin/orderService.ts`: whitelist estrito (`/[^\w\s-]/g`) + cap de 100 chars no `.or()` para prevenir injeção PostgREST
- `api/webhooks/mercadopago/route.ts`: logs sanitizados — removidos objetos Supabase completos e stack traces
- `api/checkout/create-order/route.ts`: removidos `error.stack`, `error.cause`, `error.errno` dos logs (mantém `message`)

### 📦 Dependências
- `npm audit fix` resolveu 2 vulnerabilidades HIGH (Next.js DoS, Fastify body-schema bypass) — 0 restantes
- Removidas deps não usadas de `apps/api`: `cors`, `dotenv`, `zod`
- Alinhado `@types/node` para `20.12.7` em web e api
- Removida referência a `RESEND_API_KEY` de `deploy.yml` (não usado em nenhum lugar)

### 🧪 Testes
- `checkout-502-error-fix.preservation.test.ts`: atualizado contrato para refletir novo throw de phone parsing (defesa em profundidade)
- 223 testes passando, 15 skipped (condicionais de env), 0 falhando
- SDD audit: **98/100 APROVADO**

## [Unreleased] - 2025-04-06

### 🎉 Novas Features

#### Integração Mercado Pago
- ✅ Checkout completo com Mercado Pago (Cartão, PIX, Boleto)
- ✅ Processamento de webhooks para atualização automática de status
- ✅ Páginas de resultado (confirmado, pendente, falha)
- ✅ Limpeza automática do carrinho após pagamento aprovado
- ✅ Tabela `payments` com relacionamento 1:1 com `orders`
- ✅ RPC functions: `create_order_with_payment_atomic`, `update_payment_from_webhook`

#### Autenticação e Perfil
- ✅ Sistema completo de autenticação com Supabase
- ✅ Páginas de login e cadastro com validação
- ✅ Página de perfil do usuário com edição de dados
- ✅ Upload de avatar via Cloudinary
- ✅ Proteção de rotas autenticadas

#### Carrinho e Wishlist Persistentes
- ✅ Carrinho sincronizado com Supabase
- ✅ Wishlist com limite de 50 itens
- ✅ Sincronização em tempo real
- ✅ Migração automática de localStorage para banco
- ✅ RLS policies para segurança

#### Sistema de Pedidos
- ✅ Tabelas `orders` e `order_items`
- ✅ Criação atômica de pedidos com validação de estoque
- ✅ Snapshot de preços no momento da compra
- ✅ Relacionamento com usuários e produtos

### 🎨 Melhorias de UX/UI

#### Checkout
- ✅ Formulários com alta visibilidade (fundo branco, texto escuro)
- ✅ Labels em negrito para melhor legibilidade
- ✅ Estados de foco claros e visíveis
- ✅ Logo visível no header da página de checkout

#### Navegação
- ✅ Menu reestruturado: Mantos, Seleção, Produtos, Clubes
- ✅ Remoção de itens redundantes (Treino, Acessórios)
- ✅ Hierarquia clara e intuitiva

#### Homepage
- ✅ Cards de categoria redesenhados
- ✅ "Manto Sagrado" com destaque visual (card maior, cor primária)
- ✅ Novas categorias: Clubes, Clubes Europeus, Seleções
- ✅ Remoção do botão "Nossa Jornada"

#### Depoimentos
- ✅ Depoimentos regionais do Sul do Brasil
- ✅ Cidades: Curitiba, Florianópolis, Porto Alegre
- ✅ Linguagem natural e autêntica
- ✅ Referências específicas a produtos

### 🔒 Segurança

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Políticas de acesso granulares
- ✅ Validação de webhook signature (Mercado Pago)
- ✅ Rate limiting em operações críticas
- ✅ Proteção contra race conditions

### 📚 Documentação

- ✅ README.md atualizado com todas as features
- ✅ DEPLOY-GUIDE.md - Guia completo de deploy em VPS
- ✅ MERCADOPAGO-SETUP-GUIDE.md - Setup do Mercado Pago
- ✅ NEXT-FEATURES.md - Roadmap de próximas features
- ✅ DEPLOYMENT-CHECKLIST.md - Checklist de deploy
- ✅ .env.example atualizado com todas as variáveis

### 🗄️ Banco de Dados

#### Novas Tabelas
- `cart_items` - Carrinho persistente
- `wishlist_items` - Lista de desejos
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `payments` - Pagamentos Mercado Pago
- `rate_limit_log` - Log de rate limiting

#### Novas Functions (RPC)
- `migrate_cart_to_db` - Migração de carrinho
- `migrate_wishlist_to_db` - Migração de wishlist
- `add_to_cart_atomic` - Adicionar ao carrinho (atômico)
- `create_order_with_payment_atomic` - Criar pedido com pagamento
- `update_payment_from_webhook` - Atualizar pagamento via webhook

#### Migrations Aplicadas
1. `20260404000001_create_cart_items_table.sql`
2. `20260404000002_create_wishlist_items_table.sql`
3. `20260404000003_create_wishlist_limit_trigger.sql`
4. `20260404000004_create_cart_migration_rpc.sql`
5. `20260404000005_create_wishlist_migration_rpc.sql`
6. `20260404000006_create_add_to_cart_atomic_rpc.sql`
7. `20260404000007_add_cart_items_cross_field_constraints.sql`
8. `20260404000008_create_rate_limit_log_table.sql`
9. `20260405000001_create_orders_table.sql`
10. `20260405000002_create_order_items_table.sql`
11. `20260405000003_create_orders_rls_policies.sql`
12. `20260405000004_create_order_items_rls_policies.sql`
13. `20260405000005_create_order_atomic_rpc.sql`
14. `20250406_mercadopago_payments.sql`

### 🔧 Configuração

#### Variáveis de Ambiente Adicionadas
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave pública do Supabase
- `MERCADOPAGO_ACCESS_TOKEN` - Token de acesso Mercado Pago
- `MERCADOPAGO_WEBHOOK_SECRET` - Secret para validação de webhooks
- `NEXT_PUBLIC_APP_URL` - URL da aplicação
- `RESEND_API_KEY` - API key do Resend (opcional)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (opcional)
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Cloudinary preset (opcional)

### 🐛 Correções

- ✅ SDK do Mercado Pago atualizado para v2.12.0
- ✅ Uso correto da API: `MercadoPagoConfig` + `Preference`
- ✅ Remoção do parâmetro `auto_return` que causava erro de validação
- ✅ Visibilidade dos inputs no checkout (contraste adequado)
- ✅ Logo visível no header do checkout

### 📦 Dependências

#### Adicionadas
- `mercadopago@2.12.0` - SDK oficial do Mercado Pago
- `@supabase/supabase-js` - Cliente Supabase
- `lucide-react` - Ícones (Shield para "Manto Sagrado")

### 🎯 Próximos Passos Recomendados

1. **Histórico de Pedidos** - Página "Meus Pedidos" no perfil
2. **Notificações por Email** - Confirmação de pedido, status de pagamento
3. **Rastreamento de Pedidos** - Integração com Correios/transportadora
4. **Cálculo de Frete** - Integração com API de frete em tempo real
5. **Sistema de Avaliações** - Reviews de produtos
6. **Cupons de Desconto** - Sistema de cupons e promoções

Veja detalhes completos em `NEXT-FEATURES.md`.

---

## [0.1.0] - 2025-04-05

### Inicial
- ✅ Setup do projeto com Turborepo
- ✅ Next.js 14 com App Router
- ✅ Tailwind CSS configurado
- ✅ Catálogo de produtos básico
- ✅ Carrinho em localStorage
- ✅ Wishlist em localStorage
- ✅ Design responsivo
- ✅ Tema Brasil (cores da bandeira)

---

## Convenções de Versionamento

Este projeto segue [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs

### Tags de Mudanças
- 🎉 **Novas Features**: Funcionalidades novas
- 🎨 **Melhorias de UX/UI**: Melhorias visuais e de experiência
- 🔒 **Segurança**: Melhorias de segurança
- 🐛 **Correções**: Bugs corrigidos
- 📚 **Documentação**: Atualizações de docs
- 🗄️ **Banco de Dados**: Mudanças no schema
- 🔧 **Configuração**: Mudanças em config
- 📦 **Dependências**: Atualizações de pacotes
- ⚡ **Performance**: Melhorias de performance
- ♻️ **Refatoração**: Mudanças de código sem alterar funcionalidade
