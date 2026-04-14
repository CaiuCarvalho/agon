# Deploy: Imagens da Seleção Brasileira

## 📦 O Que Foi Preparado

### 1. Imagens Copiadas
✅ 8 imagens em formato AVIF copiadas para `apps/web/public/products/selecao/`

| Arquivo | Tamanho | Uso |
|---------|---------|-----|
| `vini.jn.camisaselecao.avif` | 94.9 KB | **Imagem principal** |
| `paqueta.camisaselecao.avif` | 105.3 KB | Galeria |
| `selecao1.avif` | 382.6 KB | Galeria |
| `10977200A3.avif` | 173.0 KB | Galeria |
| `10977200A5.avif` | 396.2 KB | Galeria |
| `10977200A6.avif` | 637.2 KB | Galeria |
| `10977200A7.avif` | 177.2 KB | Galeria |
| `10977200A8.avif` | 163.9 KB | Galeria |

### 2. Script SQL Criado
✅ `supabase/update-brasil-product-images.sql` - Atualiza o produto no banco

### 3. Código Atualizado
✅ `apps/web/src/lib/env.ts` - Validação de variáveis de ambiente corrigida

---

## 🚀 Passos para Deploy

### Passo 1: Commit e Push

```bash
# Adicionar arquivos
git add apps/web/public/products/selecao/
git add apps/web/src/lib/env.ts
git add supabase/update-brasil-product-images.sql

# Commit
git commit -m "feat: adicionar imagens da Seleção Brasileira

- Adicionar 8 imagens em formato AVIF otimizado
- Corrigir validação de env para produção
- Preparar script SQL para atualizar produto Brasil"

# Push para produção
git push origin main
```

### Passo 2: Deploy na VPS

```bash
# SSH na VPS
ssh seu-usuario@seu-servidor

# Navegar para o projeto
cd /caminho/do/projeto

# Pull das mudanças
git pull origin main

# Rebuild (se necessário)
npm run build

# Restart do servidor
pm2 restart agon-web
```

### Passo 3: Atualizar Banco de Dados

**Opção A: Via Supabase Dashboard**
1. Acesse: https://yyhpqecnxkvtnjdqhwhk.supabase.co
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/update-brasil-product-images.sql`
4. Execute o script
5. Verifique o resultado da query

**Opção B: Via CLI (na VPS)**
```bash
# Se tiver Supabase CLI configurado
supabase db execute --file supabase/update-brasil-product-images.sql
```

### Passo 4: Verificar

1. **Imagens acessíveis**:
   ```bash
   curl -I https://seu-dominio.com/products/selecao/vini.jn.camisaselecao.avif
   # Deve retornar 200 OK
   ```

2. **Produto atualizado**:
   - Acesse a página do produto Brasil
   - Verifique se a imagem principal carrega
   - Verifique se a galeria tem 8 imagens

3. **Cache**:
   - Limpe o cache do navegador (Ctrl+Shift+Delete)
   - Force refresh (Ctrl+F5)

---

## 🔍 Troubleshooting

### Imagens não carregam (404)

**Causa**: Arquivos não foram copiados corretamente no deploy

**Solução**:
```bash
# Na VPS, verificar se os arquivos existem
ls -lh apps/web/public/products/selecao/

# Se não existirem, copiar manualmente
scp -r apps/web/public/products/selecao/ usuario@servidor:/caminho/do/projeto/apps/web/public/products/
```

### Produto não atualizado

**Causa**: Script SQL não foi executado

**Solução**:
1. Execute o script SQL manualmente no Supabase Dashboard
2. Verifique se a coluna `images` existe:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'products' AND column_name = 'images';
   ```

### Erro 500 na página

**Causa**: Variáveis de ambiente incorretas

**Solução**:
1. Verifique se as variáveis na VPS estão corretas
2. As chaves devem começar com `eyJ` (JWT)
3. Reinicie o servidor após atualizar `.env`

---

## 📊 Estrutura Final

```
apps/web/public/products/
├── selecao/                          # Nova pasta
│   ├── 10977200A3.avif              # 173 KB
│   ├── 10977200A5.avif              # 396 KB
│   ├── 10977200A6.avif              # 637 KB
│   ├── 10977200A7.avif              # 177 KB
│   ├── 10977200A8.avif              # 164 KB
│   ├── paqueta.camisaselecao.avif   # 105 KB
│   ├── selecao1.avif                # 383 KB
│   ├── vini.jn.camisaselecao.avif   # 95 KB (principal)
│   └── README.md                     # Documentação
├── selecao-paqueta.avif             # Manter (compatibilidade)
└── selecao-vini.avif                # Manter (compatibilidade)
```

---

## ✅ Checklist de Deploy

- [ ] Commit das imagens
- [ ] Push para repositório
- [ ] Pull na VPS
- [ ] Verificar arquivos copiados
- [ ] Executar script SQL
- [ ] Verificar produto atualizado
- [ ] Testar imagens no navegador
- [ ] Limpar cache
- [ ] Verificar página de produtos
- [ ] Verificar carrossel na home

---

## 🎯 Resultado Esperado

Após o deploy:

1. **Página de Produtos** (`/products`):
   - Produto "Brasil" aparece com imagem `vini.jn.camisaselecao.avif`
   - Carrega rápido (95 KB)

2. **Página do Produto** (`/products/[id]`):
   - Galeria com 8 imagens
   - Navegação entre imagens
   - Zoom funcional

3. **Carrossel Home**:
   - Produto "Brasil" com imagem atualizada
   - Sem cache da imagem antiga

---

**Data**: 2026-04-14  
**Versão**: 1.0  
**Status**: Pronto para deploy
