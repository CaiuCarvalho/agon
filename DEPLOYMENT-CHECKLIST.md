# Checklist de Deploy - Agon E-commerce

Use este checklist para garantir que todos os passos foram executados corretamente.

## 📋 Pré-Deploy

### Supabase
- [ ] Projeto criado no Supabase
- [ ] Todas as 14 migrations aplicadas (verificar com query)
- [ ] Credenciais copiadas (URL + anon key)
- [ ] RLS habilitado em todas as tabelas
- [ ] Produtos seed inseridos (opcional)

### Mercado Pago
- [ ] Conta criada e verificada
- [ ] Credenciais de PRODUÇÃO obtidas
- [ ] Webhook secret gerado (32 bytes hex)
- [ ] Credenciais salvas em local seguro

### VPS
- [ ] Servidor provisionado (Ubuntu 20.04+)
- [ ] Node.js 18+ instalado
- [ ] Nginx instalado
- [ ] PM2 instalado globalmente
- [ ] Domínio apontando para o IP do servidor
- [ ] Acesso SSH configurado

## 🚀 Durante o Deploy

### Código
- [ ] Repositório clonado em `/var/www/agon/app`
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env.local` criado em `apps/web/`
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build executado com sucesso (`npm run build`)

### Variáveis de Ambiente Configuradas
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `MERCADOPAGO_ACCESS_TOKEN` (produção)
- [ ] `MERCADOPAGO_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL` (https://seu-dominio.com)
- [ ] `NODE_ENV=production`
- [ ] `RESEND_API_KEY` (opcional)
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (opcional)
- [ ] `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (opcional)

### PM2
- [ ] Aplicação iniciada com PM2
- [ ] PM2 configurado para iniciar no boot (`pm2 startup`)
- [ ] Configuração salva (`pm2 save`)
- [ ] Status verificado (`pm2 status`)
- [ ] Logs verificados sem erros (`pm2 logs`)

### Nginx
- [ ] Arquivo de configuração criado em `/etc/nginx/sites-available/agon`
- [ ] Link simbólico criado em `/etc/nginx/sites-enabled/`
- [ ] Configuração testada (`sudo nginx -t`)
- [ ] Nginx recarregado (`sudo systemctl reload nginx`)
- [ ] Site acessível via HTTP

### SSL/HTTPS
- [ ] Certbot instalado
- [ ] Certificado SSL obtido (`sudo certbot --nginx`)
- [ ] Redirect HTTP → HTTPS configurado
- [ ] Renovação automática testada (`sudo certbot renew --dry-run`)
- [ ] Site acessível via HTTPS

### Webhook Mercado Pago
- [ ] URL configurada no painel: `https://seu-dominio.com/api/webhooks/mercadopago`
- [ ] Evento "Pagamentos" selecionado
- [ ] Secret configurado (mesmo do `.env.local`)
- [ ] Webhook salvo no painel

## ✅ Pós-Deploy (Testes)

### Testes Funcionais
- [ ] Página inicial carrega corretamente
- [ ] Imagens carregam corretamente
- [ ] Navegação funciona (todos os links)
- [ ] Cadastro de novo usuário funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Edição de perfil funciona
- [ ] Upload de avatar funciona (se Cloudinary configurado)

### Testes de Carrinho
- [ ] Adicionar produto ao carrinho funciona
- [ ] Atualizar quantidade funciona
- [ ] Remover produto funciona
- [ ] Carrinho persiste após logout/login
- [ ] Carrinho sincroniza em tempo real

### Testes de Wishlist
- [ ] Adicionar produto à wishlist funciona
- [ ] Remover produto funciona
- [ ] Wishlist persiste após logout/login
- [ ] Limite de 50 itens é respeitado

### Testes de Checkout
- [ ] Formulário de checkout carrega
- [ ] Validação de campos funciona
- [ ] Inputs são visíveis (fundo claro, texto escuro)
- [ ] Logo do site está visível no header
- [ ] Botão "Finalizar Compra" funciona
- [ ] Redirecionamento para Mercado Pago funciona

### Testes de Pagamento (Use cartão de teste)
- [ ] Página do Mercado Pago carrega
- [ ] Pagamento com cartão de teste funciona
- [ ] Redirecionamento de volta ao site funciona
- [ ] Webhook é recebido (verificar logs: `pm2 logs`)
- [ ] Status do pedido é atualizado
- [ ] Carrinho é limpo após pagamento aprovado
- [ ] Página de confirmação é exibida

### Testes de Admin (se aplicável)
- [ ] Login como admin funciona
- [ ] Dashboard carrega
- [ ] Listagem de produtos funciona
- [ ] Listagem de pedidos funciona
- [ ] Criação de produto funciona (se implementado)
- [ ] Edição de produto funciona (se implementado)

### Testes de Performance
- [ ] Tempo de carregamento < 3 segundos
- [ ] Imagens otimizadas
- [ ] Lighthouse score > 80 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)

### Testes de Segurança
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Certificado SSL válido
- [ ] Headers de segurança configurados
- [ ] RLS funcionando (usuário só vê seus dados)
- [ ] Rotas protegidas funcionam (redirect para login)

## 🔍 Monitoramento

### Logs
- [ ] Logs da aplicação sem erros críticos
- [ ] Logs do Nginx sem erros 502/503
- [ ] Logs do webhook funcionando

### Recursos
- [ ] Uso de CPU < 50%
- [ ] Uso de memória < 80%
- [ ] Disco com espaço suficiente (> 20% livre)

### Backup
- [ ] Backup automático do Supabase configurado
- [ ] Código versionado no Git
- [ ] `.env.local` salvo em local seguro (NÃO no Git)

## 📞 Contatos de Emergência

### Serviços
- Supabase Support: https://supabase.com/support
- Mercado Pago Support: https://www.mercadopago.com.br/developers/pt/support
- Resend Support: https://resend.com/support

### Comandos Úteis

```bash
# Ver logs em tempo real
pm2 logs agon-web

# Reiniciar aplicação
pm2 restart agon-web

# Ver status
pm2 status

# Ver uso de recursos
pm2 monit

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Verificar certificado SSL
sudo certbot certificates

# Renovar certificado SSL manualmente
sudo certbot renew
```

## 🎉 Deploy Completo!

Se todos os itens estão marcados, seu e-commerce está no ar e funcionando!

### Próximos Passos
1. Monitore os logs nas primeiras 24h
2. Faça alguns pedidos de teste
3. Configure Google Analytics (se ainda não configurado)
4. Planeje as próximas features (veja `NEXT-FEATURES.md`)
5. Configure monitoramento de erros (Sentry, LogRocket, etc.)

### Manutenção Regular
- Verificar logs semanalmente
- Atualizar dependências mensalmente
- Fazer backup manual antes de grandes mudanças
- Testar fluxo completo após cada deploy

---

**Data do Deploy:** ___/___/______

**Responsável:** _______________________

**Notas:**
_____________________________________________
_____________________________________________
_____________________________________________
