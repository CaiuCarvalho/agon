# Bugfix Requirements Document

## Introduction

O sistema está retornando erro 502 Bad Gateway ao tentar finalizar pedidos no checkout em produção (VPS). O erro ocorre especificamente ao chamar o endpoint `POST /api/checkout/create-order`, indicando que o nginx não consegue se comunicar com o backend Next.js. O erro é intermitente localmente (às vezes funciona), mas consistente em produção, sugerindo problemas de configuração de ambiente, caminhos de arquivos, ou processo do servidor na VPS.

O objetivo deste bugfix é realizar um diagnóstico sistemático completo da VPS para identificar e corrigir:
- Configuração incorreta ou ausente de variáveis de ambiente
- Caminhos incorretos para arquivos .env
- Processo Next.js não rodando ou com problemas
- Configuração incorreta do nginx
- Problemas de permissão de arquivos
- Credenciais inválidas do Mercado Pago ou Supabase

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o usuário clica em "Finalizar Pedido" na página de checkout em produção THEN o sistema retorna erro 502 Bad Gateway com resposta HTML do nginx ao invés de processar o pedido

1.2 WHEN o endpoint `/api/checkout/create-order` é chamado em produção THEN o nginx retorna `<html><head><title>502 Bad Gateway</title></head>` indicando que não consegue se comunicar com o backend

1.3 WHEN as variáveis de ambiente não estão configuradas corretamente na VPS THEN o processo Next.js pode não iniciar ou falhar silenciosamente sem logs claros

1.4 WHEN o arquivo .env.local não existe ou está no caminho errado na VPS THEN as variáveis `MERCADOPAGO_ACCESS_TOKEN` e `NEXT_PUBLIC_APP_URL` ficam undefined causando falhas no checkout

1.5 WHEN o processo Next.js não está rodando ou crashou na VPS THEN o nginx não consegue fazer proxy reverso para o backend resultando em 502

1.6 WHEN há problemas de permissão nos arquivos .env na VPS THEN o processo Next.js não consegue ler as variáveis de ambiente

### Expected Behavior (Correct)

2.1 WHEN o usuário clica em "Finalizar Pedido" na página de checkout em produção THEN o sistema SHALL processar o pedido e redirecionar para o Mercado Pago sem erros 502

2.2 WHEN o endpoint `/api/checkout/create-order` é chamado em produção THEN o sistema SHALL retornar JSON com `{success: true, initPoint: "..."}` e status 200

2.3 WHEN as variáveis de ambiente são verificadas na VPS THEN o sistema SHALL confirmar que `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas corretamente

2.4 WHEN o arquivo .env.local é verificado na VPS THEN o sistema SHALL confirmar que ele existe no caminho correto (`/var/www/agon/app/apps/web/.env.local` ou similar) e contém todas as variáveis necessárias

2.5 WHEN o processo Next.js é verificado na VPS THEN o sistema SHALL confirmar que está rodando (via PM2, systemd, ou outro gerenciador) e escutando na porta correta

2.6 WHEN os logs do servidor são verificados THEN o sistema SHALL mostrar logs detalhados do processo de checkout incluindo timestamps e validação de variáveis de ambiente

2.7 WHEN as credenciais do Mercado Pago são testadas THEN o sistema SHALL confirmar que o `MERCADOPAGO_ACCESS_TOKEN` é válido e tem permissões corretas

2.8 WHEN as credenciais do Supabase são testadas THEN o sistema SHALL confirmar que a conexão com o banco de dados está funcionando

2.9 WHEN a configuração do nginx é verificada THEN o sistema SHALL confirmar que o proxy reverso está apontando para o processo Next.js correto

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o checkout é executado em ambiente de desenvolvimento local THEN o sistema SHALL CONTINUE TO funcionar normalmente sem regressões

3.2 WHEN outros endpoints da API são chamados em produção THEN o sistema SHALL CONTINUE TO responder normalmente sem serem afetados pelas correções

3.3 WHEN usuários acessam outras páginas do site em produção THEN o sistema SHALL CONTINUE TO carregar normalmente sem impacto de performance

3.4 WHEN o processo de autenticação é executado THEN o sistema SHALL CONTINUE TO funcionar com Supabase sem alterações

3.5 WHEN webhooks do Mercado Pago são recebidos THEN o sistema SHALL CONTINUE TO processar normalmente sem regressões
