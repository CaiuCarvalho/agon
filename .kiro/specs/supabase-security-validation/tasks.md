# Implementation Plan: Supabase Security Validation

## Overview

Este plano implementa validação de segurança e dados LEAN e PRODUCTION-SAFE para o backend Supabase do e-commerce Agon. A implementação segue o princípio: secure by default, operationally simple, ready for gradual evolution.

**Princípios de Implementação:**
- Priorizar tarefas críticas (RLS, Constraints, Atomic Operations)
- Manter tasks pequenas e testáveis
- Seguir ordem de dependências
- Incluir validação em cada task
- Operacionalmente simples (um engenheiro pode manter)

## Tasks

### 1. Database Schema Setup (CRÍTICO)

- [x] 1.1 Criar tabela cart_items com constraints
  - Criar schema SQL com colunas: id, user_id, product_id, quantity, size, price_snapshot, product_name_snapshot, created_at, updated_at
  - Adicionar CHECK constraints: quantity (1-99), size (1-10 chars), price_snapshot > 0, product_name_snapshot não vazio
  - Adicionar UNIQUE constraint (user_id, product_id, size)
  - Adicionar CHECK constraint para overflow: quantity * price_snapshot <= 999999
  - Adicionar CHECK constraint: created_at <= updated_at
  - Adicionar Foreign Keys com ON DELETE CASCADE para user_id e product_id
  - Criar índices: idx_cart_items_user_id, idx_cart_items_product_id, idx_cart_items_updated_at
  - _Requirements: 9, 10, 11, 13, 33_

- [x] 1.2 Criar tabela wishlist_items com constraints
  - Criar schema SQL com colunas: id, user_id, product_id, created_at
  - Adicionar UNIQUE constraint (user_id, product_id)
  - Adicionar Foreign Keys com ON DELETE CASCADE para user_id e product_id
  - Criar índices: idx_wishlist_items_user_id, idx_wishlist_items_product_id, idx_wishlist_items_created_at
  - _Requirements: 12, 13_

- [x] 1.3 Criar trigger updated_at para cart_items
  - Criar função PostgreSQL update_updated_at_column()
  - Criar trigger que atualiza updated_at automaticamente em UPDATE
  - _Requirements: 33_

- [x] 1.4 Criar trigger de limite de 20 itens para wishlist
  - Criar função PostgreSQL check_wishlist_limit() que valida contagem <= 20
  - Criar trigger BEFORE INSERT que executa a validação
  - Rejeitar INSERT se usuário já tem 20 itens
  - _Requirements: 12_

- [x] 1.5 Executar migrations no Supabase
  - Aplicar schema SQL no banco de dados via Supabase Dashboard ou CLI
  - Validar que todas as tabelas foram criadas corretamente
  - Validar que todos os constraints estão ativos
  - Validar que todos os índices foram criados

### 2. RLS Policies (CRÍTICO)

- [x] 2.1 Ativar RLS nas tabelas sensíveis
  - Executar ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY
  - Executar ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY
  - Validar que RLS está ativo (consultar pg_tables)
  - _Requirements: 1_

- [x] 2.2 Criar RLS policies para cart_items
  - Criar policy "cart_items_select_own" FOR SELECT USING (auth.uid() = user_id)
  - Criar policy "cart_items_insert_own" FOR INSERT WITH CHECK (auth.uid() = user_id)
  - Criar policy "cart_items_update_own" FOR UPDATE USING/WITH CHECK (auth.uid() = user_id)
  - Criar policy "cart_items_delete_own" FOR DELETE USING (auth.uid() = user_id)
  - _Requirements: 2, 3, 4, 5_

- [x] 2.3 Criar RLS policies para wishlist_items
  - Criar policy "wishlist_items_select_own" FOR SELECT USING (auth.uid() = user_id)
  - Criar policy "wishlist_items_insert_own" FOR INSERT WITH CHECK (auth.uid() = user_id)
  - Criar policy "wishlist_items_delete_own" FOR DELETE USING (auth.uid() = user_id)
  - _Requirements: 2, 3, 5_

- [ ]* 2.4 Escrever integration tests para RLS policies
  - Testar que usuário só pode SELECT seus próprios itens
  - Testar que usuário não pode INSERT com user_id de outro usuário
  - Testar que usuário não pode UPDATE itens de outro usuário
  - Testar que usuário não pode DELETE itens de outro usuário
  - Testar que usuário não autenticado recebe zero registros
  - _Requirements: 2, 3, 4, 5_

- [x] 2.5 Checkpoint - Validar RLS funcionando
  - Testar manualmente com dois usuários diferentes
  - Validar que não há vazamento de dados entre usuários
  - Validar que todas as operações CRUD respeitam RLS

### 3. Atomic Operations via RPC (CRÍTICO)

- [x] 3.1 Criar RPC add_to_cart_atomic
  - Criar função PostgreSQL SECURITY DEFINER
  - Implementar INSERT ... ON CONFLICT (user_id, product_id, size) DO UPDATE SET quantity = quantity + p_quantity
  - Validar que product_id existe antes de inserir
  - Retornar JSONB com success, item ou error
  - Usar transação implícita com EXCEPTION handling para rollback automático
  - _Requirements: 26_

- [x] 3.2 Criar RPC migrate_cart_items
  - Criar função PostgreSQL SECURITY DEFINER que recebe p_user_id e p_items (array)
  - Usar BEGIN/COMMIT para transação explícita
  - Loop através de p_items, validar product_id existe, executar INSERT ON CONFLICT DO UPDATE
  - Em caso de erro, executar ROLLBACK automático
  - Retornar JSONB com success, migrated_count, error
  - _Requirements: 32_

- [x] 3.3 Criar RPC migrate_wishlist_items
  - Criar função PostgreSQL SECURITY DEFINER que recebe p_user_id e p_items (array)
  - Usar BEGIN/COMMIT para transação explícita
  - Validar limite de 20 itens antes de inserir
  - Loop através de p_items (máximo 20), validar product_id existe, executar INSERT ON CONFLICT DO NOTHING
  - Em caso de erro, executar ROLLBACK automático
  - Retornar JSONB com success, migrated_count, skipped_count, error
  - _Requirements: 27, 32_

- [ ]* 3.4 Escrever integration tests para RPCs
  - Testar add_to_cart_atomic com produto válido
  - Testar add_to_cart_atomic com produto duplicado (deve incrementar quantidade)
  - Testar migrate_cart_items com múltiplos itens
  - Testar migrate_wishlist_items com limite de 20 itens
  - Testar rollback em caso de product_id inválido
  - Testar idempotência das migrações
  - _Requirements: 26, 27, 32_

### 4. Rate Limiting (IMPORTANTE)

- [x] 4.1 Criar tabela rate_limit_log
  - Criar schema SQL com colunas: user_id, operation, timestamp
  - Adicionar PRIMARY KEY (user_id, operation, timestamp)
  - Criar índice idx_rate_limit_log_user_time (user_id, timestamp DESC)
  - _Requirements: 30, 31_

- [ ] 4.2 Criar função check_rate_limit
  - Criar função PostgreSQL que conta requests do usuário na última 1 minuto
  - Se count >= 60, RAISE EXCEPTION 'Rate limit exceeded'
  - Inserir log da request atual em rate_limit_log
  - _Requirements: 30, 31_

- [ ] 4.3 Criar triggers de rate limiting
  - Criar trigger BEFORE INSERT OR UPDATE em cart_items que executa check_rate_limit()
  - Criar trigger BEFORE INSERT OR UPDATE em wishlist_items que executa check_rate_limit()
  - _Requirements: 30, 31_

- [ ] 4.4 Criar função cleanup_rate_limit_logs
  - Criar função PostgreSQL que deleta logs com timestamp > 24 horas
  - Retornar contagem de registros deletados
  - Documentar como agendar via pg_cron ou Edge Function
  - _Requirements: 30, 31_

- [ ]* 4.5 Escrever integration tests para rate limiting
  - Testar que 60 requests por minuto são permitidos
  - Testar que 61º request é rejeitado com erro 429
  - Testar que rate limit reseta após 1 minuto
  - _Requirements: 30, 31_

### 5. Migration Logic no Frontend (CRÍTICO)

- [x] 5.1 Criar MigrationService
  - Criar interface TypeScript MigrationService com métodos: migrateUserData, needsMigration, markMigrationComplete, getMigrationStatus
  - Implementar needsMigration() que verifica se localStorage tem dados
  - Implementar getMigrationStatus() que retorna 'pending' | 'in_progress' | 'complete' | 'failed'
  - _Requirements: 28, 32_

- [x] 5.2 Implementar migrateUserData
  - Ler cart items de localStorage (chave 'agon_cart')
  - Ler wishlist items de localStorage (chave 'agon_wishlist')
  - Chamar RPC migrate_cart_items e migrate_wishlist_items em paralelo
  - Implementar timeout de 10 segundos
  - Em caso de sucesso, chamar markMigrationComplete()
  - Em caso de falha, preservar localStorage e retornar erro
  - _Requirements: 28, 32_

- [x] 5.3 Implementar migration gate no login
  - Após login bem-sucedido, verificar needsMigration()
  - Se true, mostrar loading state e executar migrateUserData()
  - Se timeout (10s), mostrar erro e permitir reload da página
  - Se sucesso, limpar localStorage e redirecionar para app
  - _Requirements: 28_

- [x] 5.4 Implementar clear localStorage após sucesso
  - Criar função clearLocalCart() que remove 'agon_cart'
  - Criar função clearLocalWishlist() que remove 'agon_wishlist'
  - Criar função markMigrationComplete() que seta flag 'agon_migrated'
  - Chamar após migração bem-sucedida
  - _Requirements: 28_

- [ ]* 5.5 Escrever integration tests para migration
  - Testar migração de cart com 2 itens
  - Testar migração de wishlist com 5 itens
  - Testar que localStorage é limpo após sucesso
  - Testar que localStorage é preservado após falha
  - Testar idempotência (executar migração 2x)
  - Testar timeout de 10 segundos
  - _Requirements: 28, 32_

### 6. Environment Variables (CRÍTICO)

- [x] 6.1 Criar schema Zod para validação
  - Criar envSchema com z.object para NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
  - Adicionar validação: URL deve ser válida, keys devem começar com 'eyJ'
  - Criar função validateEnvironment() que executa envSchema.parse(process.env)
  - Adicionar check que Service_Role_Key não está disponível no client (typeof window !== 'undefined')
  - _Requirements: 7, 8_

- [x] 6.2 Validar que Service Role Key não está no frontend
  - Adicionar validação em validateEnvironment() que falha se SUPABASE_SERVICE_ROLE_KEY está acessível no client
  - Garantir que apenas NEXT_PUBLIC_* variables são expostas ao frontend
  - _Requirements: 7_

- [x] 6.3 Atualizar .gitignore
  - Adicionar .env.local, .env.*.local ao .gitignore
  - Validar que .env files não estão versionados
  - _Requirements: 7, 8_

- [x] 6.4 Criar .env.example
  - Criar arquivo com todas as variáveis necessárias
  - Usar valores placeholder (não valores reais)
  - Documentar propósito de cada variável
  - _Requirements: 8_

- [ ]* 6.5 Escrever unit tests para validação de environment
  - Testar que schema rejeita URL inválida
  - Testar que schema rejeita keys que não começam com 'eyJ'
  - Testar que Service_Role_Key não é acessível no client
  - _Requirements: 7, 8_

### 7. Storage Security (IMPORTANTE)

- [ ] 7.1 Criar bucket privado
  - Criar bucket 'user-uploads' com public=false via Supabase Dashboard
  - _Requirements: 19_

- [ ] 7.2 Criar RLS policies para storage
  - Criar policy "users_upload_own" FOR INSERT que valida auth.uid() = foldername
  - Criar policy "users_download_own" FOR SELECT que valida auth.uid() = foldername
  - _Requirements: 19_

- [ ] 7.3 Implementar validação de MIME type
  - Criar função detectMimeType(bytes) que lê magic bytes
  - Suportar JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (52 49 46 46 ... 57 45 42 50)
  - Criar função validateFile(file, config) que valida MIME type real
  - _Requirements: 34_

- [ ] 7.4 Implementar validação de tamanho
  - Adicionar validação em validateFile() que rejeita files > 5MB
  - Usar whitelist de MIME types: ['image/jpeg', 'image/png', 'image/webp']
  - Retornar erro user-friendly se validação falhar
  - _Requirements: 34_

- [ ]* 7.5 Escrever integration tests para storage
  - Testar upload de arquivo válido (JPEG, 2MB)
  - Testar rejeição de arquivo muito grande (>5MB)
  - Testar rejeição de MIME type inválido
  - Testar que usuário não pode acessar arquivo de outro usuário
  - _Requirements: 19, 34_

### 8. Auth Configuration (IMPORTANTE)

- [ ] 8.1 Configurar JWT expiration
  - Configurar jwt_expiry = 3600 (1 hora) no Supabase Auth settings
  - Habilitar refresh_token_rotation_enabled = true
  - _Requirements: 16_

- [ ] 8.2 Configurar refresh token rotation
  - Validar que refresh tokens expiram após uso
  - Configurar sessions_timebox = 86400 (24 horas)
  - Configurar sessions_inactivity_timeout = 3600 (1 hora)
  - _Requirements: 16_

- [ ] 8.3 Desabilitar providers não usados
  - Desabilitar Google, GitHub, e outros providers no Supabase Auth
  - Manter apenas Email/Password habilitado
  - Validar redirect URLs para prevenir open redirect
  - _Requirements: 17_

- [ ] 8.4 Implementar session invalidation on password change
  - Criar função PostgreSQL invalidate_other_sessions() que deleta sessões exceto a atual
  - Criar trigger AFTER UPDATE em auth.users que executa a função quando encrypted_password muda
  - _Requirements: 38_

- [ ]* 8.5 Escrever integration tests para auth
  - Testar que JWT expira após 1 hora
  - Testar que refresh token rotation funciona
  - Testar que sessões antigas são invalidadas após troca de senha
  - _Requirements: 16, 38_

### 9. Logging (IMPORTANTE)

- [ ] 9.1 Implementar logging estruturado
  - Criar interface LogEntry com level, timestamp, operation, user_id, error, metadata
  - Criar logger com métodos info(), warn(), error()
  - Usar formato JSON estruturado para todos os logs
  - _Requirements: 35_

- [ ] 9.2 Implementar redaction de dados sensíveis
  - Criar lista SENSITIVE_FIELDS: ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'session', 'email', 'cpf', 'credit_card']
  - Criar função redactSensitiveData(obj) que substitui campos sensíveis por '[REDACTED]'
  - Aplicar redaction em todos os logs
  - _Requirements: 22, 35_

- [ ] 9.3 Configurar níveis de log
  - Implementar níveis: info (operações normais), warn (erros recuperáveis), error (erros irrecuperáveis)
  - Usar info para cart.add, wishlist.add
  - Usar warn para rate limit hit, validation failed
  - Usar error para database down, RLS denied
  - _Requirements: 35_

- [ ]* 9.4 Escrever unit tests para logging
  - Testar que redactSensitiveData remove passwords
  - Testar que redactSensitiveData remove tokens
  - Testar que logs não expõem Service_Role_Key
  - Testar formato JSON estruturado
  - _Requirements: 22, 35_

### 10. CI/CD Enforcement (CRÍTICO)

- [x] 10.1 Criar script validate-rls.ts
  - Criar script Node.js que conecta ao Supabase com Service Role Key
  - Listar todas as tabelas e validar que RLS está ativo em cart_items e wishlist_items
  - Listar todas as policies e validar que não existem policies com USING (true)
  - Validar que todas as policies usam auth.uid() para isolamento
  - Falhar com exit code 1 se validação falhar
  - _Requirements: 39, 40_

- [ ] 10.2 Criar script validate-constraints.ts
  - Criar script Node.js que conecta ao Supabase
  - Validar que unique constraints obrigatórios existem (cart: user_id+product_id+size, wishlist: user_id+product_id)
  - Validar que check constraints obrigatórios existem (quantity 1-99, size length)
  - Validar que foreign keys estão configurados com ON DELETE CASCADE
  - Gerar relatório de constraints
  - Falhar com exit code 1 se constraints obrigatórios estão ausentes
  - _Requirements: 42_

- [x] 10.3 Criar script check-secrets.sh
  - Criar script Bash que busca Service_Role_Key em código versionado (grep -r "SUPABASE_SERVICE_ROLE_KEY" apps/web/src/)
  - Validar que .env files não estão commitados (git ls-files | grep -E "\.env$")
  - Detectar fallback patterns inseguros (grep -r "process.env.KEY || 'default'")
  - Detectar JWT tokens hardcoded (grep -r "eyJ[a-zA-Z0-9_-]*\.")
  - Falhar com exit code 1 se secrets são detectados
  - _Requirements: 41_

- [x] 10.4 Criar GitHub Actions workflow
  - Criar .github/workflows/security-check.yml
  - Adicionar job que executa validate-rls.ts
  - Adicionar job que executa validate-constraints.ts
  - Adicionar job que executa check-secrets.sh
  - Adicionar job que executa npm run lint:security
  - Configurar para rodar em pull requests e pushes para main
  - _Requirements: 39, 40, 41, 46_

- [ ] 10.5 Integrar ESLint security rules
  - Instalar eslint-plugin-security
  - Adicionar regra customizada no-sql-string-concat que detecta concatenação de strings em queries
  - Adicionar regra que detecta uso de process.env sem validação
  - Criar npm script lint:security que executa ESLint com regras de segurança
  - _Requirements: 46_

- [ ]* 10.6 Escrever tests para CI/CD scripts
  - Testar validate-rls.ts com banco sem RLS (deve falhar)
  - Testar validate-constraints.ts com banco sem constraints (deve falhar)
  - Testar check-secrets.sh com código contendo Service_Role_Key (deve falhar)
  - _Requirements: 39, 40, 41_

### 11. Testing (CRÍTICO)

- [ ]* 11.1 Escrever integration tests para RLS
  - Criar suite de testes que valida isolamento de usuários
  - Testar SELECT, INSERT, UPDATE, DELETE para cart_items
  - Testar SELECT, INSERT, DELETE para wishlist_items
  - Usar dois usuários de teste para validar isolamento
  - _Requirements: 2, 3, 4, 5_

- [ ]* 11.2 Escrever integration tests para constraints
  - Testar quantity range (1-99)
  - Testar size length (1-10)
  - Testar unique constraints
  - Testar foreign key cascade deletes
  - Testar cross-field validation (quantity * price <= 999999)
  - _Requirements: 9, 10, 11, 13, 33_

- [ ]* 11.3 Escrever integration tests para rate limiting
  - Testar que 60 requests/min são permitidos
  - Testar que 61º request é rejeitado
  - Testar que rate limit reseta após 1 minuto
  - _Requirements: 30, 31_

- [ ]* 11.4 Escrever integration tests para migration
  - Testar migração de cart com múltiplos itens
  - Testar migração de wishlist com múltiplos itens
  - Testar idempotência (executar 2x)
  - Testar rollback em caso de product_id inválido
  - Testar que localStorage é limpo após sucesso
  - _Requirements: 28, 32_

- [ ]* 11.5 Escrever unit tests para validation
  - Testar Zod schemas para environment variables
  - Testar redaction de dados sensíveis em logs
  - Testar validação de MIME type
  - Testar validação de tamanho de arquivo
  - _Requirements: 7, 8, 22, 34, 35_

### 12. Documentation (IMPORTANTE)

- [ ] 12.1 Criar runbook de regeneração de API keys
  - Documentar processo de regeneração de Anon_Key no Supabase Dashboard
  - Documentar processo de regeneração de Service_Role_Key
  - Documentar checklist de atualização: frontend .env, backend .env, CI/CD secrets
  - Documentar tempo de propagação de novas chaves
  - Documentar como validar que chave antiga foi revogada
  - _Requirements: 21_

- [ ] 12.2 Criar runbook de resposta a RLS violations
  - Documentar como detectar RLS violations em logs
  - Documentar como investigar tentativas de acesso não autorizado
  - Documentar quando alertar sobre possível ataque
  - Documentar como bloquear usuário suspeito
  - _Requirements: 18_

- [ ] 12.3 Criar runbook de restore de backup
  - Documentar como acessar backups no Supabase Dashboard
  - Documentar processo de restore manual
  - Documentar como validar integridade após restore
  - Documentar disaster recovery steps básicos
  - _Requirements: 37_

- [ ] 12.4 Documentar debugging guide
  - Documentar como debugar RLS policies (usar EXPLAIN)
  - Documentar como debugar constraints violations
  - Documentar como debugar rate limiting
  - Documentar como debugar migration failures
  - Documentar estrutura de logs e como buscar erros
  - _Requirements: 48_

### 13. Backup Strategy (IMPORTANTE)

- [ ] 13.1 Configurar backups diários no Supabase
  - Habilitar backups automáticos diários via Supabase Dashboard
  - Configurar retenção de 30 dias
  - _Requirements: 37_

- [ ] 13.2 Documentar processo de restore manual
  - Documentar como baixar backup do Supabase
  - Documentar como restaurar backup localmente para teste
  - Documentar como restaurar backup em produção
  - _Requirements: 37_

- [ ] 13.3 Criar disaster recovery runbook
  - Documentar cenários de disaster (database corruption, acidental delete)
  - Documentar steps de recovery para cada cenário
  - Documentar RTO (Recovery Time Objective) e RPO (Recovery Point Objective)
  - Documentar contatos de emergência
  - _Requirements: 37_

### 14. Realtime Security (IMPORTANTE)

- [ ] 14.1 Validar que Realtime respeita RLS
  - Verificar que RLS está habilitado em cart_items e wishlist_items
  - Testar que eventos Realtime respeitam user_id isolation
  - Validar que usuário não autenticado não recebe eventos
  - _Requirements: 14, 29_

- [ ] 14.2 Implementar filtros client-side no Realtime
  - Adicionar filtro user_id = auth.uid() ao se inscrever em cart_items channel
  - Adicionar filtro user_id = auth.uid() ao se inscrever em wishlist_items channel
  - Documentar que filtros são otimização, não proteção (RLS é a proteção)
  - _Requirements: 15, 29_

- [ ]* 14.3 Escrever integration tests para Realtime
  - Testar que usuário só recebe eventos de seus próprios itens
  - Testar que usuário não recebe eventos de outros usuários
  - Testar com dois clientes simultâneos
  - _Requirements: 14, 15, 29_

### 15. Final Validation and Checkpoint

- [ ] 15.1 Executar todos os CI/CD checks localmente
  - Executar validate-rls.ts e validar que passa
  - Executar validate-constraints.ts e validar que passa
  - Executar check-secrets.sh e validar que passa
  - Executar npm run lint:security e validar que passa
  - _Requirements: 39, 40, 41, 46_

- [ ] 15.2 Executar suite completa de integration tests
  - Executar todos os integration tests de RLS
  - Executar todos os integration tests de constraints
  - Executar todos os integration tests de rate limiting
  - Executar todos os integration tests de migration
  - Executar todos os integration tests de Realtime
  - Validar que todos passam
  - _Requirements: 2-5, 9-13, 14-15, 26-32_

- [x] 15.3 Checkpoint final - Validar sistema completo
  - Testar fluxo end-to-end: cadastro → login → adicionar ao carrinho → adicionar à wishlist
  - Testar com dois usuários simultâneos para validar isolamento
  - Testar migration de localStorage para banco
  - Testar rate limiting com múltiplas requests
  - Validar que logs não expõem dados sensíveis
  - Validar que CI/CD pipeline está configurado e funcionando
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Prioridade: RLS > Constraints > App Logic > Optional Protections
- Sistema é operacionalmente simples: um engenheiro pode compreender e manter
- Features avançadas (anomaly detection, advanced monitoring) podem ser adicionadas incrementalmente no futuro
