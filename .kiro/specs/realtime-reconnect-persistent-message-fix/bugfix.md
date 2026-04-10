# Documento de Requisitos do Bugfix

## Introdução

O componente `RealtimeStatus` exibe uma mensagem persistente "Reconectando...Sincronização pausada" que não desaparece. O problema ocorre porque o `realtimeStatus` no hook `useCart` permanece em 'disconnected' indefinidamente, mesmo quando não deveria mostrar nenhuma mensagem ou quando a conexão deveria ter sido estabelecida com sucesso.

Este bug afeta a experiência do usuário ao criar uma percepção de que o sistema está com problemas de conexão, mesmo quando não há necessidade de conexão Realtime (usuários guest) ou quando a conexão deveria estar funcionando normalmente (usuários autenticados).

## Análise do Bug

### Comportamento Atual (Defeito)

1.1 QUANDO o hook useCart é inicializado ENTÃO o sistema define realtimeStatus como 'disconnected' por padrão

1.2 QUANDO o usuário é guest (não autenticado) ENTÃO o sistema mantém realtimeStatus como 'disconnected' e exibe a mensagem de reconexão após 2 segundos

1.3 QUANDO o usuário está autenticado mas migrationStatus não é 'complete' ou 'error' ENTÃO o sistema mantém realtimeStatus como 'disconnected' e exibe a mensagem de reconexão

1.4 QUANDO a subscrição Realtime falha ou não recebe status 'SUBSCRIBED' ENTÃO o sistema mantém realtimeStatus como 'disconnected' indefinidamente

### Comportamento Esperado (Correto)

2.1 QUANDO o hook useCart é inicializado e o usuário é guest ENTÃO o sistema NÃO DEVERÁ definir realtimeStatus como 'disconnected' e NÃO DEVERÁ exibir mensagem de reconexão

2.2 QUANDO o usuário é guest (não autenticado) ENTÃO o sistema DEVERÁ usar um estado neutro (ex: 'idle' ou 'not_applicable') que não aciona a exibição da mensagem

2.3 QUANDO o usuário está autenticado mas migrationStatus não é 'complete' ou 'error' ENTÃO o sistema DEVERÁ usar um estado neutro que não aciona a exibição da mensagem

2.4 QUANDO a subscrição Realtime é estabelecida com sucesso (status 'SUBSCRIBED') ENTÃO o sistema DEVERÁ definir realtimeStatus como 'connected' e a mensagem DEVERÁ desaparecer

2.5 QUANDO a subscrição Realtime falha após tentativas de reconexão ENTÃO o sistema DEVERÁ usar fallback de polling sem exibir mensagem persistente ao usuário

### Comportamento Inalterado (Prevenção de Regressão)

3.1 QUANDO o usuário está autenticado e migrationStatus é 'complete' ou 'error' ENTÃO o sistema DEVERÁ CONTINUAR A estabelecer subscrição Realtime

3.2 QUANDO a conexão Realtime é perdida temporariamente ENTÃO o sistema DEVERÁ CONTINUAR A tentar reconectar com backoff exponencial

3.3 QUANDO eventos Realtime são recebidos com client_id do próprio cliente ENTÃO o sistema DEVERÁ CONTINUAR A filtrar esses eventos para prevenir loops

3.4 QUANDO a subscrição Realtime falha ENTÃO o sistema DEVERÁ CONTINUAR A usar polling como fallback

3.5 QUANDO o componente RealtimeStatus detecta realtimeStatus 'disconnected' por mais de 2 segundos ENTÃO o sistema DEVERÁ CONTINUAR A exibir a mensagem (mas apenas quando realmente aplicável)

## Condição do Bug

### Função de Condição do Bug

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CartHookState
  OUTPUT: boolean
  
  // Retorna true quando a condição do bug é atendida
  RETURN (X.user = null AND X.realtimeStatus = 'disconnected') OR
         (X.user != null AND X.migrationStatus NOT IN ['complete', 'error'] AND X.realtimeStatus = 'disconnected') OR
         (X.user != null AND X.migrationStatus IN ['complete', 'error'] AND X.realtimeSubscriptionFailed = true AND X.realtimeStatus = 'disconnected')
END FUNCTION
```

### Especificação da Propriedade

```pascal
// Propriedade: Verificação de Correção
FOR ALL X WHERE isBugCondition(X) DO
  result ← useCart'(X)
  ASSERT (X.user = null IMPLIES result.realtimeStatus != 'disconnected') AND
         (X.user != null AND X.migrationStatus NOT IN ['complete', 'error'] IMPLIES result.realtimeStatus != 'disconnected') AND
         (X.user != null AND X.realtimeSubscriptionFailed = true IMPLIES result.realtimeStatus IN ['connected', 'idle'] AND no_persistent_message(result))
END FOR
```

### Objetivo de Preservação

```pascal
// Propriedade: Verificação de Preservação
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT useCart(X).behavior = useCart'(X).behavior
END FOR
```

Onde:
- **useCart**: Hook original (não corrigido)
- **useCart'**: Hook corrigido
- **X.user**: Estado de autenticação do usuário
- **X.migrationStatus**: Status da migração do carrinho
- **X.realtimeSubscriptionFailed**: Indica se a subscrição Realtime falhou
- **X.realtimeStatus**: Status atual da conexão Realtime
