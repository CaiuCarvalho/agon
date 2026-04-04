# Guia: Criar Usuário de Teste no Supabase

## 📋 Passo a Passo (VERSÃO SIMPLES)

### 1. Acesse o SQL Editor do Supabase
```
https://supabase.com/dashboard/project/yyhpqecnxkvtnjdqhwhk/sql/new
```

### 2. Use o script simplificado

Abra o arquivo **`supabase-create-test-user-simple.sql`** (recomendado)

Este script:
- ✅ Deleta usuário existente automaticamente
- ✅ Cria usuário e profile em uma transação
- ✅ Mostra mensagem de sucesso
- ✅ Verifica o resultado

### 3. Execute o script

1. Cole o conteúdo completo no SQL Editor
2. Clique em **"Run"** ou pressione `Ctrl+Enter`
3. Aguarde a mensagem: "Usuário criado com sucesso!"

### 4. Verifique o resultado

Você verá uma tabela com:
- `id`: UUID do usuário
- `email`: teste@agon.com
- `confirmado_em`: Data/hora (já confirmado)
- `nome_metadata`: Usuário Teste
- `nome_profile`: Usuário Teste
- `role`: customer

## 🔐 Credenciais Padrão

Se você não alterou o script, use estas credenciais para fazer login:

```
Email: teste@agon.com
Senha: teste123
```

## ✅ O que o script faz

1. **Cria o usuário** na tabela `auth.users` com:
   - Email confirmado automaticamente
   - Senha criptografada
   - Metadados do usuário (nome)

2. **Cria o profile** na tabela `profiles` com:
   - Mesmo ID do usuário
   - Nome extraído dos metadados
   - Role padrão: "customer"

3. **Verifica** se tudo foi criado corretamente

## 🚨 Solução de Problemas

### Erro: "there is no unique or exclusion constraint"
- **Solução**: Use o script `supabase-create-test-user-simple.sql` em vez do original
- Este script não usa `ON CONFLICT` e funciona em todas as versões

### Erro: "duplicate key value violates unique constraint"
- O email já existe no banco
- **Solução**: O script simplificado deleta automaticamente o usuário existente
- Ou altere o email no script

### Erro: "relation does not exist"
- A tabela `profiles` não existe
- Solução: Execute as migrations do Supabase primeiro

### Usuário criado mas não consegue fazer login
- Verifique se `email_confirmed_at` não é NULL
- O script já define isso automaticamente

## 🧪 Testar o Login

Após executar o script:

1. Acesse: `http://localhost:3000/login`
2. Use as credenciais:
   - Email: `teste@agon.com`
   - Senha: `teste123`
3. Clique em "Entrar na Conta"
4. Você deve ser redirecionado para a home page

## 🔄 Criar Múltiplos Usuários

Para criar mais usuários de teste, altere o email no script e execute novamente:

```sql
-- Usuário 1
'teste1@agon.com'

-- Usuário 2
'teste2@agon.com'

-- Usuário Admin (altere o role)
'admin@agon.com'
-- E na linha do INSERT INTO profiles, altere:
'admin' as role  -- em vez de 'customer'
```

## 📝 Notas Importantes

- ✅ Email já vem confirmado (não precisa verificar inbox)
- ✅ Profile é criado automaticamente
- ✅ Senha é criptografada com bcrypt
- ✅ Usuário pode fazer login imediatamente
- ⚠️ Use apenas em desenvolvimento/teste
- ⚠️ Não use este método em produção

## 🎯 Próximos Passos

Após criar o usuário e fazer login com sucesso:

1. ✅ Teste a navegação entre páginas
2. ✅ Teste o logout
3. ✅ Teste acessar `/login` estando logado (deve redirecionar)
4. ✅ Teste acessar `/perfil` (deve funcionar)
5. ✅ Teste acessar `/admin` (deve redirecionar se não for admin)

---

**Dúvidas?** Verifique os logs do navegador (F12 → Console) para mais detalhes.
