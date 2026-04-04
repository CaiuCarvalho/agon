# Templates de Email - Agon Imports

Templates profissionais de email para autenticação Supabase com a identidade visual da Agon Imports.

## 📧 Templates Disponíveis

### 1. Confirmação de Cadastro (`confirm-signup.html`)
- Usado quando um novo usuário se cadastra
- Inclui benefícios da conta (lançamentos exclusivos, frete grátis, descontos)
- CTA principal: "CONFIRMAR EMAIL"

### 2. Redefinição de Senha (`reset-password.html`)
- Usado quando o usuário solicita recuperação de senha
- Inclui aviso de segurança destacado
- CTA principal: "REDEFINIR SENHA"

### 3. Magic Link (`magic-link.html`)
- Usado para login sem senha (se habilitado)
- Acesso rápido e seguro
- CTA principal: "ACESSAR MINHA CONTA"

## 🎨 Identidade Visual

Todos os templates seguem a identidade da Agon Imports:

- **Cores principais:**
  - Verde Brasil: `#009C3B`
  - Amarelo Brasil: `#FFDF00`
  - Background escuro: `#0a0f1a` / `#111827`

- **Tipografia:**
  - Títulos: Uppercase, bold, itálico, tracking apertado
  - Corpo: Inter, legível, espaçamento confortável

- **Elementos:**
  - Gradiente Brasil no topo
  - Linha divisória verde
  - Botões arredondados com sombra neon
  - Cards de aviso com borda amarela

## 📝 Como Usar no Supabase

1. Acesse o dashboard do Supabase
2. Vá em **Authentication** → **Email Templates**
3. Selecione o template que deseja editar:
   - **Confirm signup** → use `confirm-signup.html`
   - **Reset password** → use `reset-password.html`
   - **Magic Link** → use `magic-link.html`
4. Copie e cole o conteúdo HTML
5. Salve

## 🔗 Variáveis do Supabase

Os templates usam as seguintes variáveis que o Supabase substitui automaticamente:

- `{{ .ConfirmationURL }}` - Link de confirmação/ação
- `{{ .Email }}` - Email do usuário (opcional, não usado nos templates atuais)
- `{{ .Token }}` - Token de confirmação (opcional)

## ✅ Checklist de Configuração

- [ ] SMTP configurado (Resend)
- [ ] Domínio verificado no Resend (`agonimports.com`)
- [ ] Sender email configurado (`noreply@agonimports.com`)
- [ ] Templates copiados para o Supabase
- [ ] Rota de callback criada (`/auth/callback`)
- [ ] URLs de redirecionamento configuradas no Supabase
- [ ] Testado em diferentes clientes de email

## 📱 Compatibilidade

Templates testados e otimizados para:
- Gmail (web e mobile)
- Outlook (web e desktop)
- Apple Mail (iOS e macOS)
- Yahoo Mail
- Protonmail

## 🚀 Próximos Passos

Após configurar os templates:

1. Ative "Confirm email" no Supabase
2. Teste criando uma nova conta
3. Verifique se o email chega corretamente
4. Teste o fluxo completo de confirmação
5. Monitore os logs do Resend para garantir entrega

---

**Agon Imports** - Equipamento de Seleção. Alma Brasileira.
