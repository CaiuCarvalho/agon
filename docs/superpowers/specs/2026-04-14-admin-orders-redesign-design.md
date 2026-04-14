# Admin Orders — Redesign Completo

**Data:** 2026-04-14
**Escopo:** Página de pedidos do admin (`/admin/orders`)
**Abordagem:** Split view clássico — lista fixa à esquerda, painel de detalhes à direita

---

## 1. Layout Geral

A página ocupa a altura total da viewport (abaixo do nav do admin). Dois painéis lado a lado:

- **Lista** — largura fixa de 380px, scroll independente
- **Painel direito** — `flex-1`, fixo na viewport, sem scroll próprio (tudo visível de uma vez)

Estado vazio do painel direito: ilustração + texto "Selecione um pedido para ver os detalhes".

---

## 2. Lista de Pedidos

### Layout do item

```
● João Silva                    [Enviado] [Aprovado]
  #abc12345 · São Paulo, SP
  R$ 289,90 · há 2h
```

- Indicador `●` colorido por status de envio:
  - Cinza → pendente
  - Azul → processando
  - Índigo → enviado
  - Verde → entregue
- Dois badges no canto direito: status de envio + status de pagamento
- Badges de envio são clicáveis — foco no campo correspondente no painel direito
- Pedidos com pagamento pendente há mais de 24h: borda esquerda laranja sutil
- Item selecionado: fundo destacado (bg-muted ou similar)

### Controles do topo da lista

- Campo de busca — filtra por nome do cliente ou ID do pedido (debounce 300ms, busca no servidor)
- Dropdown filtro por status de pagamento (pending, approved, rejected, cancelled, refunded, in_process)
- Dropdown filtro por status de envio (pending, processing, shipped, delivered)
- Botão "Limpar filtros" aparece quando algum filtro está ativo

### Carregamento

- Scroll infinito — carrega próxima página ao atingir o fim da lista
- Skeleton loader nas primeiras linhas enquanto carrega
- Ordenação padrão: mais recentes primeiro

---

## 3. Painel Direito

Quatro seções empilhadas verticalmente, todas visíveis sem scroll:

### 3.1 Cabeçalho

```
#abc12345 · João Silva · 14/04/2026
R$ 289,90 · PIX · ✅ Aprovado
```

- ID do pedido (primeiros 8 chars + "...")
- Nome completo do cliente
- Data de criação formatada (dd/MM/yyyy)
- Valor total em BRL
- Método de pagamento
- Badge de status de pagamento

### 3.2 Itens do Pedido

Tabela compacta:

| Produto | Tamanho | Qtd | Subtotal |
|---------|---------|-----|----------|
| Camisa Brasil | GG | 2 | R$ 189,80 |
| Meião Seleção | M | 1 | R$ 100,10 |

### 3.3 Endereço de Entrega

```
Rua X, 123 · Apto 4
São Paulo, SP · 01310-100   [📋 Copiar]
```

- Botão `📋 Copiar` copia o endereço completo formatado para o clipboard
- Feedback visual inline no botão (ícone troca por ✓ por 2s)

### 3.4 Painel de Envio

**Caso normal (pagamento aprovado):**

```
Status:         [Processando        ▼]
Transportadora: [Correios           ▼]  ← visível só se status ≥ Enviado
Rastreio:       [________________________]  ← visível só se status ≥ Enviado
                                [Salvar Envio]
```

**Caso override (pagamento não aprovado):**

```
⚠️  Pagamento ainda não confirmado (PIX pendente)
    Tem certeza que deseja atualizar o envio?

Status:         [Enviado            ▼]
Transportadora: [Correios           ▼]
Rastreio:       [BR123456789BR_____]

              [Cancelar]  [Salvar mesmo assim]
```

- O aviso aparece quando o admin muda o status e o pagamento não é `approved`
- Não bloqueia — exige confirmação explícita via botão diferenciado (`variant="destructive"` ou similar)
- Transportadora e código de rastreio: obrigatórios apenas quando status = `shipped` ou `delivered`
- Status de envio não pode regredir (ex: de `shipped` para `processing`)

**Feedback de sucesso:**

- Inline no painel (não toast) — ex: badge "✓ Salvo" que desaparece após 3s
- Badge na lista de pedidos atualiza via Supabase Realtime (canal já existente)

**Histórico de status** (abaixo do formulário, compacto):

```
14/04 15:32 · Enviado
14/04 10:01 · Processando
13/04 18:44 · Pendente
```

- Timestamp + novo status (sem indicar quem alterou, por simplicidade — não há multiusuário hoje)

---

## 4. Regras de Negócio

| Regra | Comportamento |
|-------|--------------|
| Progressão de status | Só avança (pending → processing → shipped → delivered). Tentativa de regressão: campo desabilita opções anteriores no dropdown. |
| Pagamento não aprovado | Mostra aviso mas permite salvar com confirmação explícita |
| Transportadora + rastreio | Obrigatórios quando status = shipped ou delivered; hidden quando status < shipped |
| Busca | Filtra por nome do cliente OU ID do pedido; debounce 300ms; requisição ao servidor |
| Alerta de pagamento pendente > 24h | Borda laranja no item da lista; sem ação automática |

---

## 5. Arquitetura de Componentes

```
OrdersPage (page.tsx)
├── OrdersSplitView              ← novo componente raiz
│   ├── OrdersList               ← painel esquerdo (380px)
│   │   ├── OrderSearchBar       ← busca + filtros
│   │   ├── OrderListItem        ← item individual
│   │   └── (scroll infinito via Intersection Observer)
│   └── OrderDetailPanel         ← painel direito
│       ├── OrderDetailHeader    ← cabeçalho
│       ├── OrderItemsTable      ← itens
│       ├── OrderAddressBlock    ← endereço + copiar
│       └── ShippingUpdateForm   ← formulário de envio + histórico
│           └── StatusHistory    ← histórico compacto
```

**Hooks:**
- `useOrdersList` — busca paginada com scroll infinito, filtros, busca
- `useOrderDetail` — detalhes do pedido selecionado (fetch ao selecionar)
- `useShippingUpdate` — mutação de envio com lógica de override
- Realtime: reaproveitamento do canal Supabase já existente em `useAdminOrders`

**API:**
- `GET /api/admin/orders` — adicionar parâmetro `search` (nome ou ID)
- `GET /api/admin/orders/[id]` — sem mudança
- `PATCH /api/admin/orders/[id]/shipping` — adicionar flag `forceOverride: boolean`

---

## 6. O que NÃO está no escopo

- Redesign do Dashboard ou de Produtos (próximas iterações)
- Histórico por usuário (não há multiusuário admin hoje)
- Cancelamento de pedido pela interface admin
- Notificações sonoras / browser notifications (removidas do novo design — simplificação)
- Exportação de pedidos para CSV
