# Plano de Implementação: Integração Mercado Pago Checkout

## Visão Geral

Este plano implementa a integração completa do Mercado Pago no sistema de checkout, substituindo o método "Pagamento na Entrega" por pagamentos online reais. A implementação inclui criação de preferências de pagamento, processamento de webhooks, sincronização de status, e páginas de resultado para diferentes estados de pagamento.

A arquitetura segue o padrão existente do projeto com três camadas: Data Layer (Supabase), Services Layer (TypeScript), e UI Layer (React/Next.js).

## Tarefas

- [x] 1. Configurar schema do banco de dados e políticas RLS
  - Criar tabela `payments` com relacionamento 1:1 com `orders`
  - Criar índices para performance (mercadopago_payment_id, mercadopago_preference_id, order_id)
  - Implementar políticas RLS para proteger dados de pagamento
  - Criar trigger para atualizar `updated_at` automaticamente
  - Atualizar constraint de `payment_method` na tabela `orders` para incluir métodos do Mercado Pago
  - _Requisitos: 1.1-1.13, 2.1-2.4_

- [x] 2. Criar funções RPC para operações atômicas
  - [x] 2.1 Implementar função `create_order_with_payment_atomic`
    - Validar carrinho não vazio
    - Criar registro de pedido
    - Processar itens do carrinho com validação de estoque
    - Criar registro de pagamento inicial com status 'pending'
    - Calcular e atualizar total do pedido
    - Retornar dados do pedido e pagamento em formato JSON
    - _Requisitos: 16.1-16.7, 5.1-5.2_
  
  - [x] 2.2 Implementar função `update_payment_from_webhook`
    - Buscar pagamento por mercadopago_payment_id
    - Atualizar status do pagamento e payment_method
    - Mapear status de pagamento para status de pedido (approved→processing, rejected→cancelled)
    - Atualizar status do pedido
    - Limpar carrinho se status for 'approved'
    - Garantir idempotência para reenvios de webhook
    - _Requisitos: 8.1-8.11, 9.1-9.6, 10.1-10.4_

- [x] 3. Configurar variáveis de ambiente e SDK do Mercado Pago
  - Adicionar variáveis ao `.env.example`: MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL
  - Instalar pacote npm `mercadopago` (versão ^2.0.0)
  - Criar serviço `mercadoPagoService.ts` com inicialização singleton do SDK
  - Implementar validação de Access_Token (formato APP_USR-)
  - Implementar tratamento de erro quando credenciais estão ausentes
  - _Requisitos: 3.1-3.7, 20.1-20.6_

- [x] 4. Implementar serviço Mercado Pago
  - [x] 4.1 Implementar criação de preferências de pagamento
    - Criar método `createPreference` usando SDK do Mercado Pago
    - Construir objeto de preferência com items, payer, back_urls, notification_url
    - Incluir external_reference (order_id) e statement_descriptor
    - Configurar payment_methods para permitir todos os métodos
    - Retornar preference_id e init_point
    - Implementar tratamento de erros com mensagens claras
    - _Requisitos: 4.1-4.11_
  
  - [x] 4.2 Implementar busca de detalhes de pagamento
    - Criar método `getPaymentDetails` usando SDK do Mercado Pago
    - Extrair status, payment_method_id, external_reference
    - Implementar tratamento de erros (pagamento não encontrado, timeout)
    - _Requisitos: 8.1-8.5_
  
  - [x] 4.3 Implementar validação de assinatura de webhook
    - Criar método `validateWebhookSignature` com HMAC-SHA256
    - Extrair ts e v1 do header x-signature
    - Construir manifest string: `id:{data.id};request-id:{x-request-id};ts:{ts};`
    - Computar hash usando MERCADOPAGO_WEBHOOK_SECRET
    - Comparar hashes usando `crypto.timingSafeEqual` (constant-time)
    - _Requisitos: 7.1-7.9_
  
  - [x] 4.4 Implementar construtor de preferência a partir de pedido
    - Criar método `buildPreferenceRequest` que transforma Order em PreferenceRequest
    - Mapear order_items para items array do Mercado Pago
    - Extrair DDD e número do telefone formatado brasileiro
    - Construir URLs de retorno (success, failure, pending)
    - Configurar notification_url com NEXT_PUBLIC_APP_URL
    - _Requisitos: 4.2-4.9, 21.1-21.6_

- [x] 5. Implementar serviço de pagamentos (paymentService)
  - Criar método `getPaymentByOrderId` para buscar pagamento por order_id
  - Criar método `getPaymentByMercadoPagoId` para buscar por mercadopago_payment_id
  - Criar método `getPaymentByPreferenceId` para buscar por preference_id
  - Criar método `updatePaymentFromWebhook` que chama RPC function
  - Criar método `getUserPayments` com paginação
  - Implementar função helper `transformPaymentRow` para converter snake_case → camelCase
  - Implementar tratamento de erros (not found, database errors)
  - _Requisitos: 8.1-8.11, 22.1-22.6_

- [x] 6. Implementar serviço ViaCEP
  - Criar `viaCEPService.ts` com método `fetchAddressByCEP`
  - Validar formato de CEP (8 dígitos)
  - Fazer requisição GET para `https://viacep.com.br/ws/{cep}/json/`
  - Extrair logradouro, bairro, localidade, uf
  - Retornar null se CEP não encontrado ou erro de API
  - Implementar timeout de 2 segundos
  - Criar métodos auxiliares: `validateCEP`, `formatCEP`
  - _Requisitos: 14.3-14.6, 27.3_

- [x] 7. Implementar serviço de validação brasileira
  - Criar `validationService.ts` com validações de formatos brasileiros
  - Implementar `validateCEP` com formatação XXXXX-XXX
  - Implementar `validatePhone` com formatação (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  - Implementar `validateState` contra lista de estados brasileiros
  - Implementar `formatCurrency` usando Intl.NumberFormat pt-BR
  - Implementar `sanitizeInput` para remover caracteres perigosos
  - _Requisitos: 15.1-15.7_

- [x] 8. Criar schemas de validação Zod
  - Criar `paymentStatusSchema` com enum de status válidos
  - Criar `mercadopagoPaymentMethodSchema` com métodos de pagamento
  - Criar `shippingFormSchema` com validações brasileiras (CEP, telefone, estado)
  - Criar `webhookNotificationSchema` para validar payload de webhook
  - Criar `mercadopagoEnvSchema` para validar variáveis de ambiente
  - Criar `cepSchema` e `phoneSchema` com transformações de formatação
  - _Requisitos: 14.7-14.11, 15.1-15.7_

- [x] 9. Implementar componente ShippingForm
  - Criar formulário com react-hook-form e zodResolver
  - Adicionar campos: nome, CEP, endereço, cidade, estado, telefone, email
  - Implementar auto-fill de CEP usando ViaCEP no evento onBlur
  - Implementar formatação automática de CEP e telefone no onChange
  - Exibir loading state durante busca de CEP
  - Exibir mensagem de erro quando CEP não encontrado
  - Exibir erros de validação inline abaixo de cada campo
  - Implementar select de estados com lista de estados brasileiros
  - _Requisitos: 14.1-14.11_

- [x] 10. Implementar componente PaymentMethodsDisplay
  - Criar componente para exibir métodos de pagamento disponíveis
  - Adicionar ícones para: Cartão de Crédito, Cartão de Débito, PIX, Boleto
  - Exibir logo do Mercado Pago
  - Adicionar badge de segurança "Pagamento 100% seguro"
  - Exibir mensagem: "Você será redirecionado para o Mercado Pago"
  - Implementar layout responsivo (grid 2 colunas mobile, 4 desktop)
  - _Requisitos: 19.1-19.5_

- [x] 11. Atualizar página de checkout
  - [x] 11.1 Atualizar CheckoutPage (server component)
    - Verificar autenticação do usuário
    - Buscar itens do carrinho do Supabase
    - Redirecionar para /cart se carrinho vazio
    - Transformar dados do carrinho para formato do componente
    - Passar userEmail e userId para componente cliente
    - _Requisitos: 5.1-5.2_
  
  - [x] 11.2 Criar CheckoutPageClient (client component)
    - Renderizar ShippingForm com integração ViaCEP
    - Renderizar CartSummary com itens do carrinho
    - Renderizar PaymentMethodsDisplay
    - Implementar handleSubmit que chama API de criação de pedido
    - Redirecionar para init_point do Mercado Pago após sucesso
    - Exibir loading state durante processamento
    - Exibir toast de erro em caso de falha
    - _Requisitos: 5.3-5.7, 17.1-17.8, 24.1-24.8_

- [x] 12. Criar API route para criação de pedido com pagamento
  - Criar `/api/checkout/create-order/route.ts`
  - Validar autenticação do usuário
  - Validar dados do formulário com Zod
  - Chamar RPC function `create_order_with_payment_atomic`
  - Criar preferência de pagamento usando mercadoPagoService
  - Atualizar registro de pagamento com preference_id
  - Retornar init_point para redirecionamento
  - Implementar rollback em caso de erro
  - Retornar erros específicos (estoque insuficiente, erro Mercado Pago, erro de rede)
  - _Requisitos: 4.1-4.11, 5.1-5.7, 16.1-16.7, 17.1-17.8_

- [x] 13. Implementar webhook endpoint
  - [x] 13.1 Criar `/api/webhooks/mercadopago/route.ts`
    - Aceitar apenas método POST
    - Extrair headers: x-signature, x-request-id
    - Extrair body: data.id (payment_id), type (topic)
    - Validar assinatura usando mercadoPagoService
    - Retornar 401 se assinatura inválida
    - Retornar 200 se topic não for 'payment'
    - _Requisitos: 6.1-6.9, 7.1-7.9_
  
  - [x] 13.2 Implementar processamento de pagamento no webhook
    - Buscar detalhes do pagamento do Mercado Pago
    - Extrair status, payment_method_id, external_reference
    - Chamar paymentService.updatePaymentFromWebhook
    - Implementar tratamento de erro com status 500 (para retry)
    - Retornar 200 OK dentro de 5 segundos
    - Logar todas as tentativas de processamento
    - _Requisitos: 8.1-8.11, 18.1-18.7, 28.1-28.7_

- [ ] 14. Checkpoint - Testar fluxo de criação de pedido e webhook
  - Verificar que pedido é criado com status 'pending'
  - Verificar que pagamento é criado com preference_id
  - Verificar redirecionamento para Mercado Pago
  - Testar webhook com assinatura válida e inválida
  - Verificar atualização de status após webhook
  - Verificar limpeza de carrinho após pagamento aprovado
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas

- [x] 15. Implementar página de sucesso (/pedido/confirmado)
  - Criar server component que busca dados de pagamento e pedido
  - Extrair payment_id ou order_id dos query params
  - Buscar payment e order do Supabase com join
  - Verificar que usuário autenticado é dono do pedido
  - Renderizar OrderConfirmationClient com dados
  - Redirecionar para /login se não autenticado
  - Exibir 404 se pagamento não encontrado
  - _Requisitos: 11.1-11.13_

- [x] 16. Criar componente OrderConfirmationClient
  - Exibir badge de status (Aprovado, Pendente, Rejeitado) com cores apropriadas
  - Exibir número do pedido (primeiros 8 caracteres do order_id)
  - Exibir método de pagamento usado
  - Exibir valor total em formato brasileiro (R$ X.XXX,XX)
  - Exibir informações de entrega (nome, endereço, cidade, estado, CEP)
  - Exibir lista de itens do pedido (nome, quantidade, tamanho, preço, subtotal)
  - Exibir data de criação do pedido
  - Exibir mensagem de sucesso: "Pagamento aprovado! Seu pedido está sendo processado."
  - Adicionar botão "Continuar Comprando" que redireciona para /products
  - _Requisitos: 11.4-11.12_

- [x] 17. Implementar página de pagamento pendente (/pedido/pendente)
  - Criar server component que busca dados de pagamento
  - Extrair payment_id dos query params
  - Buscar payment e order do Supabase
  - Renderizar PendingPaymentClient com dados
  - _Requisitos: 12.1-12.8_

- [x] 18. Criar componente PendingPaymentClient
  - Exibir mensagem específica baseada em payment_method:
    - PIX: "Aguardando pagamento do PIX. Você receberá confirmação por email."
    - Boleto: "Boleto gerado. Pague até a data de vencimento para confirmar seu pedido."
    - Outros: "Seu pagamento está sendo processado. Você receberá confirmação em breve."
  - Exibir número do pedido e valor total
  - Adicionar botão "Voltar para Produtos"
  - _Requisitos: 12.3-12.8_

- [x] 19. Implementar página de falha de pagamento (/pedido/falha)
  - Criar server component que busca dados de pagamento
  - Extrair payment_id dos query params
  - Buscar payment e order do Supabase
  - Renderizar FailurePaymentClient com dados
  - _Requisitos: 13.1-13.6_

- [x] 20. Criar componente FailurePaymentClient
  - Exibir mensagem de erro: "Não foi possível processar seu pagamento."
  - Listar possíveis razões: cartão recusado, saldo insuficiente, dados incorretos
  - Adicionar botão "Tentar Novamente" que redireciona para /checkout
  - Adicionar botão "Voltar ao Carrinho"
  - Manter pedido com status 'pending' (não deletar)
  - _Requisitos: 13.2-13.6_

- [x] 21. Implementar TypeScript interfaces e types
  - Criar interfaces: Payment, PreferenceRequest, PreferenceResponse, MercadoPagoPayment
  - Criar interfaces: WebhookNotification, WebhookSignature
  - Criar interfaces: CreateOrderWithPaymentRequest, CreateOrderWithPaymentResponse
  - Criar interfaces: UpdatePaymentStatusRequest, UpdatePaymentStatusResponse
  - Criar interfaces: ViaCEPResponse, AddressData
  - Criar interfaces: PaymentRow, ShippingFormValues
  - Organizar em arquivo `contracts.ts` ou `types.ts`

- [x] 22. Adicionar tratamento de erros e logging
  - Implementar logging de criação de preferências (order_id, preference_id)
  - Implementar logging de recepção de webhooks (payment_id, status, timestamp)
  - Implementar logging de atualizações de status (old status, new status)
  - Implementar logging de falhas de validação de assinatura
  - Garantir que Access_Token nunca é logado
  - Usar formato estruturado (JSON) para logs
  - _Requisitos: 28.1-28.7_

- [x] 23. Implementar validação de variáveis de ambiente
  - Criar função de validação usando mercadopagoEnvSchema
  - Validar no startup da aplicação (em middleware ou config)
  - Lançar erro claro se variáveis ausentes ou inválidas
  - Validar formato de MERCADOPAGO_ACCESS_TOKEN (APP_USR-)
  - Validar que NEXT_PUBLIC_APP_URL é URL válida
  - _Requisitos: 3.6-3.7, 20.1-20.6, 21.5-21.6_

- [ ] 24. Adicionar testes de integração
  - [ ]* 24.1 Testar criação de preferência de pagamento
    - Mock do SDK do Mercado Pago
    - Verificar que preferência é criada com dados corretos
    - Verificar tratamento de erro quando SDK falha
  
  - [ ]* 24.2 Testar validação de assinatura de webhook
    - Testar com assinatura válida (deve retornar true)
    - Testar com assinatura inválida (deve retornar false)
    - Testar com formato de assinatura incorreto
  
  - [ ]* 24.3 Testar atualização de status via webhook
    - Mock de paymentService e mercadoPagoService
    - Verificar que status é atualizado corretamente
    - Verificar que carrinho é limpo quando status = 'approved'
    - Verificar idempotência (múltiplas chamadas com mesmo payment_id)
  
  - [ ]* 24.4 Testar integração ViaCEP
    - Mock da API ViaCEP
    - Verificar preenchimento automático de endereço
    - Verificar tratamento de CEP não encontrado
    - Verificar timeout após 2 segundos
  
  - [ ]* 24.5 Testar validações brasileiras
    - Testar formatação de CEP (XXXXX-XXX)
    - Testar formatação de telefone ((XX) XXXXX-XXXX)
    - Testar validação de estados brasileiros
    - Testar formatação de moeda (R$ X.XXX,XX)

- [ ] 25. Checkpoint final - Testes end-to-end
  - Testar fluxo completo: adicionar ao carrinho → checkout → pagamento → confirmação
  - Testar com diferentes métodos de pagamento (cartão, PIX, boleto)
  - Testar cenários de erro (estoque insuficiente, pagamento rejeitado)
  - Testar webhook com sandbox do Mercado Pago
  - Verificar que RLS impede acesso a pagamentos de outros usuários
  - Verificar responsividade em mobile e desktop
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de integração validam componentes críticos
- A implementação segue o padrão arquitetural existente do projeto (Next.js App Router, Supabase, TypeScript)
- Foco em segurança: validação de assinaturas, RLS, credenciais server-side only
- Foco em UX brasileira: validações de CEP/telefone, formatação de moeda, integração ViaCEP
