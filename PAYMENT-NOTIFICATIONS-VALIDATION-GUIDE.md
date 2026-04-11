# Guia de Validação - Sistema de Notificações de Pagamento

## Visão Geral

Este guia fornece instruções passo a passo para validar o sistema de notificações em tempo real implementado nas Tasks 6-12.

## Pré-requisitos

1. ✅ Tasks 1-5 completadas (webhook handler, RPC function, useRealtimeOrders)
2. ✅ Servidor de desenvolvimento rodando (`npm run dev`)
3. ✅ Supabase Realtime habilitado para tabela `orders`
4. ✅ Arquivo de som em `apps/web/public/sounds/notification.mp3`

## Componentes Implementados

### Task 6: OrderStatusBadge
- **Arquivo**: `apps/web/src/components/admin/OrderStatusBadge.tsx`
- **Funcionalidade**: Badge visual com cores por status

### Task 7: Sistema de Notificações Toast
- **Arquivo**: `apps/web/src/hooks/useOrderNotifications.ts`
- **Funcionalidade**: Toast notifications usando Sonner

### Task 8: Notificações do Navegador
- **Arquivo**: `apps/web/src/hooks/useBrowserNotifications.ts`
- **Funcionalidade**: Browser notifications nativas

### Task 9: Alerta Sonoro
- **Arquivo**: `apps/web/src/hooks/useSoundAlert.ts`
- **Funcionalidade**: Reprodução de som de notificação

### Task 10: Preferências de Notificação
- **Arquivo**: `apps/web/src/components/admin/NotificationPreferences.tsx`
- **Funcionalidade**: Toggles para configurar notificações

### Task 11: Admin Orders Page Atualizada
- **Arquivo**: `apps/web/src/modules/admin/components/Orders/OrdersPage.tsx`
- **Funcionalidade**: Integração completa com real-time updates

## Checklist de Validação

### 1. Validar OrderStatusBadge

**Passos**:
1. Acesse `/admin/orders`
2. Verifique que cada pedido exibe um badge colorido
3. Confirme as cores:
   - 🟡 Amarelo: Pendente
   - 🟢 Verde: Processando
   - 🔵 Azul: Enviado
   - ⚪ Cinza: Entregue
   - 🔴 Vermelho: Cancelado

**Resultado Esperado**: ✅ Badges exibidos corretamente com cores apropriadas

---

### 2. Validar Conexão em Tempo Real

**Passos**:
1. Acesse `/admin/orders`
2. Verifique o indicador de status no canto superior esquerdo
3. Deve mostrar:
   - 🟢 "Conectado" com ícone de WiFi verde

**Resultado Esperado**: ✅ Status "Conectado" exibido

**Se Desconectado**:
- Clique no botão "Reconectar"
- Verifique se reconecta automaticamente

---

### 3. Validar Toast Notifications

**Passos**:
1. Abra `/admin/orders` em uma aba
2. Em outra aba/janela, crie um pedido de teste ou simule aprovação de pagamento
3. Volte para a aba do admin

**Resultado Esperado**: 
✅ Toast notification aparece no canto da tela com:
- Título: "Pedido Aprovado!"
- Descrição: Número do pedido, nome do cliente, valor
- Botão: "Ver Pedido"
- Duração: 10 segundos
- Cor: Verde (sucesso)

**Teste Manual Alternativo**:
```javascript
// No console do navegador em /admin/orders
const mockOrder = {
  id: '12345678-1234-1234-1234-123456789012',
  status: 'processing',
  totalAmount: 150.00,
  shippingName: 'João Silva',
  paymentMethod: 'pix'
};

// Isso deve disparar a notificação
window.dispatchEvent(new CustomEvent('test-notification', { detail: mockOrder }));
```

---

### 4. Validar Browser Notifications

**Passos**:
1. Acesse `/admin/orders`
2. Quando solicitado, clique em "Permitir" para notificações do navegador
3. Mude para outra aba (importante: a aba do admin NÃO deve estar ativa)
4. Simule aprovação de pagamento

**Resultado Esperado**: 
✅ Notificação nativa do navegador aparece com:
- Título: "Novo Pedido Aprovado!"
- Corpo: "Pedido #12345678 - R$ 150,00"
- Ícone: Logo Agon
- Ao clicar: Foca a janela e navega para o pedido
- Auto-fecha após 10 segundos

**Nota**: Browser notifications só aparecem quando a aba NÃO está ativa

---

### 5. Validar Alerta Sonoro

**Pré-requisito**: Arquivo `apps/web/public/sounds/notification.mp3` deve existir

**Passos**:
1. Acesse `/admin/orders`
2. Certifique-se que o som está habilitado (veja Task 10)
3. Mantenha a aba ativa
4. Simule aprovação de pagamento

**Resultado Esperado**: 
✅ Som de notificação reproduz automaticamente
- Duração: 1-2 segundos
- Volume: Moderado (50%)
- Não reproduz se aba inativa

**Troubleshooting**:
- Se o som não tocar, verifique se o arquivo existe
- Verifique políticas de autoplay do navegador
- Tente interagir com a página primeiro (clique em qualquer lugar)

---

### 6. Validar Preferências de Notificação

**Passos**:
1. Crie um componente de teste ou adicione ao admin layout:

```tsx
import { NotificationPreferences } from '@/components/admin/NotificationPreferences';

// Adicione em algum lugar do admin panel
<NotificationPreferences />
```

2. Verifique os 3 toggles:
   - 🔔 Notificações Toast
   - 💻 Notificações do Navegador
   - 🔊 Alerta Sonoro

3. Desabilite cada um e teste se as notificações respeitam as preferências

**Resultado Esperado**: 
✅ Preferências persistem após reload
✅ Notificações respeitam as configurações
✅ Status de permissão do navegador exibido corretamente

---

### 7. Validar Atualização em Tempo Real da Lista

**Passos**:
1. Abra `/admin/orders` em uma aba
2. Em outra aba, acesse o Supabase Dashboard
3. Atualize manualmente o status de um pedido:
   ```sql
   UPDATE orders 
   SET status = 'processing', updated_at = NOW() 
   WHERE id = 'algum-id-de-pedido';
   ```
4. Volte para a aba do admin

**Resultado Esperado**: 
✅ Lista de pedidos atualiza automaticamente sem refresh
✅ Badge do pedido atualizado muda de cor
✅ Toast notification aparece
✅ Pedido move para o topo da lista (se ordenado por data)

---

### 8. Validar Indicador de Conexão

**Passos**:
1. Acesse `/admin/orders`
2. Abra DevTools → Network
3. Simule perda de conexão (offline mode)
4. Observe o indicador de status

**Resultado Esperado**: 
✅ Status muda para "Desconectado" (vermelho)
✅ Botão "Reconectar" aparece
✅ Alerta amarelo exibe mensagem sobre conexão perdida

**Reconexão**:
1. Restaure conexão
2. Clique em "Reconectar"
3. Status deve voltar para "Conectado" (verde)

---

### 9. Validar Múltiplas Notificações Simultâneas

**Passos**:
1. Habilite todas as notificações (toast, browser, sound)
2. Simule aprovação de pagamento
3. Mantenha aba ativa

**Resultado Esperado**: 
✅ Toast notification aparece
✅ Som reproduz
✅ Browser notification NÃO aparece (aba está ativa)

**Teste com Aba Inativa**:
1. Mude para outra aba
2. Simule aprovação de pagamento

**Resultado Esperado**: 
✅ Browser notification aparece
✅ Toast notification NÃO aparece (aba inativa)
✅ Som NÃO reproduz (aba inativa)

---

### 10. Validar Performance e Estabilidade

**Passos**:
1. Deixe `/admin/orders` aberto por 5-10 minutos
2. Simule múltiplas atualizações de pedidos
3. Verifique console do navegador para erros

**Resultado Esperado**: 
✅ Sem memory leaks
✅ Conexão permanece estável
✅ Notificações continuam funcionando
✅ Sem erros no console

---

## Testes de Integração Completa

### Cenário 1: Fluxo Completo de Pedido

1. **Cliente**: Cria pedido e paga via PIX
2. **Mercado Pago**: Envia webhook de aprovação
3. **Backend**: Processa webhook e atualiza status
4. **Admin**: Recebe notificações em tempo real

**Validação**:
- ✅ Webhook processado com sucesso (logs)
- ✅ Status do pedido atualizado no banco
- ✅ Admin recebe toast notification
- ✅ Admin recebe browser notification (se aba inativa)
- ✅ Som reproduz (se aba ativa)
- ✅ Lista de pedidos atualiza automaticamente

---

### Cenário 2: Múltiplos Admins Simultâneos

1. Abra `/admin/orders` em 2 navegadores diferentes
2. Simule aprovação de pagamento
3. Verifique ambos os navegadores

**Validação**:
- ✅ Ambos recebem notificações
- ✅ Ambos atualizam lista automaticamente
- ✅ Sem conflitos ou duplicações

---

### Cenário 3: Reconexão Após Perda de Conexão

1. Abra `/admin/orders`
2. Desabilite WiFi por 30 segundos
3. Reabilite WiFi
4. Observe reconexão automática

**Validação**:
- ✅ Status muda para "Desconectado"
- ✅ Tentativas de reconexão automáticas (exponential backoff)
- ✅ Status volta para "Conectado" após restaurar conexão
- ✅ Notificações voltam a funcionar

---

## Troubleshooting

### Toast Notifications Não Aparecem

**Possíveis Causas**:
1. Sonner não está no layout
2. Preferência desabilitada
3. Erro no hook useOrderNotifications

**Solução**:
```tsx
// Verifique em apps/web/src/app/layout.tsx
import { Toaster as Sonner } from "@/components/ui/sonner";

// No body:
<Sonner />
```

---

### Browser Notifications Não Aparecem

**Possíveis Causas**:
1. Permissão negada
2. Aba está ativa (notifications só aparecem quando inativa)
3. Navegador não suporta

**Solução**:
1. Verifique permissão: `Notification.permission`
2. Solicite novamente em NotificationPreferences
3. Teste em Chrome/Firefox/Edge

---

### Som Não Reproduz

**Possíveis Causas**:
1. Arquivo não existe
2. Políticas de autoplay
3. Preferência desabilitada

**Solução**:
1. Adicione arquivo em `apps/web/public/sounds/notification.mp3`
2. Interaja com a página antes (clique)
3. Verifique preferências no localStorage

---

### Conexão em Tempo Real Falha

**Possíveis Causas**:
1. Supabase Realtime não habilitado
2. RLS policies bloqueando subscription
3. Erro de autenticação

**Solução**:
1. Habilite Realtime no Supabase Dashboard
2. Verifique RLS policies para tabela orders
3. Confirme que usuário está autenticado como admin

---

## Logs Úteis

### Console do Navegador

```javascript
// Verificar status de conexão
console.log('Notification permission:', Notification.permission);

// Verificar preferências
console.log('Preferences:', localStorage.getItem('admin-notification-preferences'));

// Verificar som habilitado
console.log('Sound enabled:', localStorage.getItem('admin-sound-alert-enabled'));
```

### Supabase Realtime

```javascript
// No console do navegador
// Verificar subscriptions ativas
supabase.getChannels();
```

---

## Critérios de Sucesso

Para considerar as Tasks 6-12 completas, todos os itens abaixo devem estar ✅:

- [ ] OrderStatusBadge exibe cores corretas
- [ ] Indicador de conexão funciona (verde/vermelho)
- [ ] Toast notifications aparecem e auto-fecham
- [ ] Browser notifications aparecem quando aba inativa
- [ ] Som reproduz quando habilitado
- [ ] Preferências persistem em localStorage
- [ ] Lista de pedidos atualiza em tempo real
- [ ] Botão "Reconectar" funciona
- [ ] Múltiplas notificações funcionam simultaneamente
- [ ] Sem erros no console
- [ ] Performance estável por 10+ minutos

---

## Próximos Passos

Após validação completa:

1. ✅ Marcar Tasks 6-12 como completas
2. ➡️ Prosseguir para Task 13 (Dashboard statistics)
3. 📝 Documentar quaisquer issues encontrados
4. 🎯 Planejar melhorias futuras (opcional)

---

**Data de Criação**: 2025-01-XX  
**Última Atualização**: 2025-01-XX  
**Status**: ✅ Pronto para validação

