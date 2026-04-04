# Agon — A Loja do Torcedor

E-commerce premium focado em artigos esportivos da Seleção Brasileira e produtos de futebol.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS 3, Radix UI, Framer Motion
- **Backend**: Next.js Server Actions, Fastify (API stub)
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

# Rodar em desenvolvimento
npm run dev
```

O site estará disponível em:
- Frontend: http://localhost:3000
- API: http://localhost:3333

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

Consulte o guia completo em [docs/DEPLOY.md](docs/DEPLOY.md).

### Quick Start (VPS)

```bash
# 1. Clonar e instalar
cd /var/www/agon/app
git pull
npm install

# 2. Configurar environment
cp apps/web/.env.production apps/web/.env.local
nano apps/web/.env.local

# 3. Build
npm run build

# 4. Subir com PM2
pm2 start npm --name agon-web -- run start --prefix apps/web
pm2 save

# 5. Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/agon
sudo ln -s /etc/nginx/sites-available/agon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. SSL (Certbot)
sudo certbot --nginx -d agonimports.com -d www.agonimports.com
```

### Deploy Automático

```bash
chmod +x deploy.sh
./deploy.sh
```

## 📚 Documentação

- [Guia de Deploy](docs/DEPLOY.md)
- [Arquitetura do Sistema](reference/architecture/system-overview.md)
- [Tech Stack](reference/architecture/tech-stack.md)
- [Regras de Domínio](reference/domain/domain-rules.md)
- [Padrões de Código](reference/engineering/coding-standards.md)

## 🎨 Features

- ✅ Catálogo de produtos com busca instantânea
- ✅ Carrinho com atualização otimista
- ✅ Wishlist (localStorage + API)
- ✅ Autenticação JWT
- ✅ Perfil de usuário com avatar
- ✅ Checkout flow completo
- ✅ Admin dashboard
- ✅ Google Analytics integrado
- ✅ Design responsivo (mobile-first)
- ✅ Animações com Framer Motion
- ✅ Dark mode (tema Brasil)

## 🔒 Segurança

- JWT com validação de expiração
- Server Actions para mutações seguras
- Validação com Zod em runtime
- HTTPS obrigatório em produção
- Proteção contra XSS e CSRF

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
