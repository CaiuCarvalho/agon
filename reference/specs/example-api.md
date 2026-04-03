# Fluxo Endpoint Spec: `checkoutPaymentTrigger`

> Tipo: **Exemplo Padrão de Spec de Backend (Server Action Next.js)**  
> Comunicação: Next Server ↔ Terceiros Providers

Nossa padronização base perante transações cruciais. Ao final dessa execução isolada de segurança do ambiente fechado servidor (Next), devolvemos ordens lógicas base da veracidade final transicional, mascarando erros brutos dos consumidores via Proxy da Função do Next de SSR/RSC.

## Esquema Input Formalizado Estritamente (`Zod Contract`)
```typescript
{
  paymentMethodIntent: "pix" | "credit_card"; // Limitadores de strings via Enums estáticos
  cartItemsPayload: Array<{
    productIdReference: string; // Exigimos UUIDs válidas limpas
    numericQty: number; // Numérico > 0 nativo
    sizeIdRef: string; // ID Variação
  }>;
  taxGeoCodeDestination: string; // CEP ou Postal sem hífens
}
```

## Ações Internas Cifradas da Action e Regras de Bloqueio Ativas
- Computadores no React *Server Actions* validam cruamente arrays que não passam ilesas na checagem física do Type Definition supracitada via Schema Zod *SafeParse()*.
- Evitar checagens em cascata custosas: Bate-se na lógica Carga x Produto (Busca do Preço Base Verdadeiro + Estoque atual) no Database num unico Aggregation Query unificado. Repudia a compra caso flutuamentos repentinos da base resultem em diferenças ao somatório original, disparando Exception controlada local customizada de Evasão.

## Devolutórias Unificadas (Output Schemas)

### Fluxo Sucedido Completo: `Sucess True` (Ok Action Return)
```json
{
   "sucessoStatus": true,
   "redirectActionPathUrl": "https://agon.com/pedido/checkout-locked-instance?session_t=h8sdhfSD...",
   "lockingTrackingRef": "LOCK_ID_1120400"
}
```

### Anulações de Condições Externas ou Violações: `Sucesso False` (Controlled Guard Errors)
```json
{
   "sucessoStatus": false,
   "errorsCaptured": [
      {
         "pointerPathField": "cartItemsPayload.0.numericQty",
         "messageInternalString": "Estoque Físico Indisponível para a Cotação da Quantia Requerida no Item."
      }
   ]
}
```
Extremos erros *500 Network Panics* causam log interno na Vercel e caem numa devolução neutra humanizada para o React Frontal sem vazamento de Stack Trace indevido aos olhos B2C ou console do browser.
