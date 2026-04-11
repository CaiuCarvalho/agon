# Guia: Adicionar Mais Produtos ao Carrossel

## 📋 Resumo das Mudanças

Foram feitas 2 mudanças principais para resolver o problema do carrossel mostrar apenas 4 produtos:

### 1. ✅ Aumentado limite de produtos carregados
- **Arquivo**: `apps/web/src/app/HomeWrapper.tsx`
- **Mudança**: `limit: 4` → `limit: 16`
- **Resultado**: Homepage agora carrega até 16 produtos

### 2. ✅ Adicionados 7 novos produtos ao seed
- **Arquivo**: `supabase/seed-products.sql`
- **Produtos adicionados**:
  - Santos
  - Grêmio
  - Internacional
  - Atlético Mineiro
  - Cruzeiro
  - Vasco
  - Botafogo
- **Total de produtos**: 9 → 16 produtos

## 🚀 Como Aplicar as Mudanças

### Passo 1: Aplicar o Seed Atualizado no Supabase

1. Abra o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo `supabase/seed-products.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

**Resultado esperado**: Você verá uma tabela mostrando os 16 produtos inseridos.

### Passo 2: Reiniciar o Servidor de Desenvolvimento

```bash
# Parar o servidor (Ctrl+C se estiver rodando)

# Limpar cache do Next.js (opcional mas recomendado)
rm -rf apps/web/.next

# Iniciar novamente
npm run dev
```

### Passo 3: Verificar no Navegador

1. Abra http://localhost:3000
2. Role até a seção "EQUIPAMENTO DE SELEÇÃO"
3. Você deve ver o carrossel com 16 produtos
4. Clique nas setas para navegar
5. O carrossel deve fazer loop infinito pelos 16 produtos

## 📊 Comportamento Esperado

### Desktop (4 produtos por vez)
- Total de páginas: 4 (16 ÷ 4 = 4 páginas)
- Navegação: Página 1 → 2 → 3 → 4 → volta para 1

### Tablet (3 produtos por vez)
- Total de páginas: 6 (16 ÷ 3 ≈ 6 páginas)
- Navegação: Loop infinito por todas as páginas

### Mobile (1 produto por vez)
- Total de páginas: 16 (16 ÷ 1 = 16 páginas)
- Navegação: Loop infinito por todos os produtos

## 🎨 Imagens dos Novos Produtos

Os novos produtos usam placeholders de imagem. Você pode adicionar imagens reais em:

```
apps/web/public/products/
├── santos.jpg
├── gremio.jpg
├── internacional.jpg
├── atletico-mineiro.jpg
├── cruzeiro.jpg
├── vasco.jpg
└── botafogo.jpg
```

Ou atualizar as URLs no banco de dados para apontar para um CDN.

## ✅ Verificação

Após aplicar as mudanças, verifique:

- [ ] Carrossel mostra mais de 4 produtos
- [ ] Navegação funciona em loop infinito
- [ ] Botões de navegação sempre ativos (nunca desabilitados)
- [ ] Auto-scroll funciona corretamente
- [ ] Pagination dots mostram todas as páginas
- [ ] Responsivo funciona em mobile, tablet e desktop

## 🐛 Troubleshooting

### Problema: Ainda mostra apenas 4 produtos

**Solução 1**: Limpar cache do Next.js
```bash
rm -rf apps/web/.next
npm run dev
```

**Solução 2**: Verificar se o seed foi aplicado corretamente
```sql
-- Execute no Supabase SQL Editor
SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL;
-- Deve retornar 16 ou mais
```

**Solução 3**: Verificar logs do servidor
```bash
# No terminal onde está rodando npm run dev
# Procure por: "[HomeWrapper] Products fetched in XXms (server-side)"
# Deve mostrar 16 produtos carregados
```

### Problema: Imagens não aparecem

**Solução**: As imagens são placeholders. Você precisa:
1. Adicionar imagens reais em `apps/web/public/products/`
2. Ou atualizar as URLs no banco de dados

## 📝 Notas Técnicas

### Por que 16 produtos?

- **Desktop**: 4 produtos por vez = 4 páginas completas
- **Tablet**: 3 produtos por vez = 5-6 páginas
- **Mobile**: 1 produto por vez = 16 páginas
- **Auto-scroll**: Mais conteúdo = experiência mais dinâmica

### Estrutura do Carrossel

```
ProductsCarousel
├── useCarouselResponsive → detecta tamanho da tela
├── useCarouselState → gerencia índice atual
├── useCarouselNavigation → lógica de loop infinito
├── useAutoScroll → scroll automático
└── useSwipeGesture → gestos touch
```

### Lógica de Loop Infinito

```typescript
// Ao ir para próxima página
if (nextIndex >= totalItems) {
  setCurrentIndex(0); // Volta ao início
}

// Ao ir para página anterior
if (prevIndex < 0) {
  const lastPageIndex = Math.floor((totalItems - 1) / itemsPerView) * itemsPerView;
  setCurrentIndex(lastPageIndex); // Vai para última página
}
```

## 🎯 Resultado Final

Após aplicar todas as mudanças:

✅ Carrossel com 16 produtos  
✅ Loop infinito funcional  
✅ Navegação suave e responsiva  
✅ Auto-scroll ativo  
✅ Experiência de usuário melhorada  

---

**Última atualização**: 2026-04-11  
**Arquivos modificados**: 
- `apps/web/src/app/HomeWrapper.tsx`
- `supabase/seed-products.sql`
