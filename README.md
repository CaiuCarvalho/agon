# Agon — A Loja do Torcedor

E-commerce premium focado em artigos esportivos da Seleção Brasileira e produtos de futebol.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS 3, Radix UI, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime), Next.js Server Actions
- **Pagamentos**: Mercado Pago (Cartão, PIX, Boleto)
- **Email**: Resend
- **Monorepo**: Turborepo + npm workspaces
- **Analytics**: Google Tag Manager

## 📦 Estrutura do Projeto

```
agon/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify API (stub)
├── packages/
│   ├── config/       # Configurações compartilhadas
│   ├── types/        # Tipos TypeScript
│   └── utils/        # Utilitários
├── reference/        # Documentação técnica e specs
├── scripts/          # Scripts de automação (SDD audit)
└── docs/             # Documentação de deploy
```

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- npm 10+

### Instalação

```bash
# Clonar repositório
git clone https://github.com/CaiuCarvalho/agon.git
cd agon

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example apps/web/.env.local
# Edite apps/web/.env.local com suas credenciais

# Rodar em desenvolvimento
npm run dev
```

O site estará disponível em:
- Frontend: http://localhost:3000
- API: http://localhost:3333

### Configuração Inicial

1. **Supabase**: Configure seu projeto no [Supabase](https://supabase.com)
2. **Migrations**: Aplique as migrations em `supabase/migrations/`
3. **Mercado Pago**: Configure credenciais de teste (veja `MERCADOPAGO-SETUP-GUIDE.md`)
4. **Cloudinary**: Configure para upload de imagens (opcional)
5. **Resend**: Configure para envio de emails (opcional)

### Build

```bash
npm run build
```

### Testes e Auditoria

```bash
# Rodar auditoria SDD
npm run audit
```

## 🌐 Deploy em Produção

Consulte o guia completo em [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md).

### Checklist Rápido

- [ ] Configurar Supabase em produção
- [ ] Aplicar todas as migrations do banco
- [ ] Configurar credenciais de produção do Mercado Pago
- [ ] Configurar webhook do Mercado Pago
- [ ] Atualizar variáveis de ambiente no VPS
- [ ] Build da aplicação
- [ ] Configurar Nginx + SSL
- [ ] Testar fluxo completo de checkout

## 📚 Documentação

- [Guia de Deploy](DEPLOY-GUIDE.md)
- [Setup Mercado Pago](MERCADOPAGO-SETUP-GUIDE.md)
- [Próximas Features](NEXT-FEATURES.md)
- [Arquitetura do Sistema](reference/architecture/system-overview.md)
- [Tech Stack](reference/architecture/tech-stack.md)
- [Regras de Domínio](reference/domain/domain-rules.md)
- [Padrões de Código](reference/engineering/coding-standards.md)

## 🎨 Features

### Autenticação e Perfil
- ✅ Autenticação completa com Supabase (email/senha)
- ✅ Páginas de login e cadastro com validação
- ✅ Perfil de usuário com edição de dados
- ✅ Upload de avatar via Cloudinary
- ✅ Proteção de rotas autenticadas

### Catálogo e Navegação
- ✅ Catálogo de produtos com busca instantânea
- ✅ Filtros por categoria e preço
- ✅ Páginas de produto com detalhes completos
- ✅ Navegação otimizada (Mantos, Seleção, Produtos, Clubes)
- ✅ Cards de categoria com destaque para "Manto Sagrado"

### Carrinho e Wishlist
- ✅ Carrinho persistente no Supabase
- ✅ Wishlist com limite de 50 itens
- ✅ Sincronização em tempo real
- ✅ Atualização otimista de UI

### Checkout e Pagamentos
- ✅ Checkout completo com formulário de entrega
- ✅ Integração com Mercado Pago (Cartão, PIX, Boleto)
- ✅ Processamento de webhooks para atualização de status
- ✅ Páginas de confirmação (sucesso, pendente, falha)
- ✅ Formulários com alta visibilidade e contraste

### Admin
- ✅ Dashboard administrativo
- ✅ Gestão de produtos (CRUD completo)
- ✅ Visualização de pedidos

### UX/UI
- ✅ Design responsivo (mobile-first)
- ✅ Animações com Framer Motion
- ✅ Tema Brasil com cores da bandeira
- ✅ Depoimentos regionais (Sul do Brasil)
- ✅ Google Analytics integrado

## 🔒 Segurança

- Autenticação via Supabase Auth (JWT)
- Row Level Security (RLS) em todas as tabelas
- Validação com Zod em runtime
- HTTPS obrigatório em produção
- Webhook signature validation (Mercado Pago)
- Proteção contra XSS e CSRF
- Rate limiting em operações críticas

## 📈 Performance

- ISR (Incremental Static Regeneration)
- Optimistic UI updates
- Image optimization (Next.js Image)
- Code splitting automático
- Lazy loading de componentes

## 🤝 Contribuindo

Este projeto segue a metodologia SDD (Spec-Driven Development). Consulte [reference/execution/feature-lifecycle.md](reference/execution/feature-lifecycle.md) para entender o fluxo de trabalho.

## 📄 Licença

Proprietary - Todos os direitos reservados

## 🐛 Suporte

Para reportar bugs ou solicitar features, abra uma issue em:
https://github.com/CaiuCarvalho/agon/issues
