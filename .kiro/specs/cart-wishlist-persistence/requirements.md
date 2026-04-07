# Requirements Document

## Introduction

Este documento especifica os requisitos para implementação de Carrinho e Wishlist Persistentes no e-commerce Agon. A feature substitui os sistemas mock atuais por persistência real no Supabase, permitindo que usuários autenticados mantenham seus carrinhos e listas de desejos sincronizados entre dispositivos, enquanto visitantes não autenticados utilizam localStorage com migração automática ao fazer login.

## Glossary

- **Cart_System**: Sistema responsável por gerenciar itens no carrinho de compras
- **Wishlist_System**: Sistema responsável por gerenciar itens na lista de desejos
- **Authenticated_User**: Usuário com sessão ativa no Supabase Auth
- **Guest_User**: Visitante sem autenticação (sessão anônima)
- **Cart_Item**: Item individual no carrinho (produto + quantidade + tamanho)
- **Wishlist_Item**: Item individual na wishlist (produto favorito)
- **Optimistic_UI**: Interface que atualiza imediatamente antes da confirmação do servidor
- **Migration**: Processo de transferir dados do localStorage para o banco ao fazer login
- **Rollback**: Reversão de mudança na UI quando operação no servidor falha
- **RLS**: Row Level Security (política de segurança do Supabase)
- **Last_Write_Wins**: Estratégia de resolução de conflitos onde a última escrita prevalece
- **Idempotency**: Propriedade de operação que pode ser executada múltiplas vezes sem efeitos colaterais
- **Retry_Strategy**: Política de tentativas automáticas após falha de operação
- **Realtime_Event**: Evento de sincronização em tempo real do Supabase
- **Conflict_Resolution**: Processo de resolver estados divergentes entre dispositivos
- **Debounce**: Técnica de atrasar execução até que operações rápidas cessem
- **Re_sync**: Processo de sincronizar estado completo do banco após desconexão

## Requirements

### Requirement 1: Persistência do Carrinho para Usuários Autenticados

**User Story:** Como um usuário autenticado, quero que meu carrinho seja salvo no banco de dados, para que eu possa acessá-lo de qualquer dispositivo.

#### Acceptance Criteria

1. WHEN um Authenticated_User adiciona um produto ao carrinho, THE Cart_System SHALL persistir o Cart_Item na tabela `cart_items` do Supabase
2. WHEN um Authenticated_User remove um Cart_Item, THE Cart_System SHALL deletar o registro correspondente da tabela `cart_items`
3. WHEN um Authenticated_User altera a quantidade de um Cart_Item, THE Cart_System SHALL atualizar o campo `quantity` na tabela `cart_items`
4. WHEN um Authenticated_User altera o tamanho de um Cart_Item, THE Cart_System SHALL atualizar o campo `size` na tabela `cart_items`
5. WHEN um Authenticated_User acessa o carrinho, THE Cart_System SHALL carregar todos os Cart_Items do banco de dados vinculados ao `user_id`

### Requirement 2: Carrinho Local para Visitantes

**User Story:** Como um visitante não autenticado, quero adicionar produtos ao carrinho sem precisar fazer login, para que eu possa navegar livremente antes de decidir comprar.

#### Acceptance Criteria

1. WHEN um Guest_User adiciona um produto ao carrinho, THE Cart_System SHALL armazenar o Cart_Item no localStorage do navegador
2. WHEN um Guest_User remove um Cart_Item, THE Cart_System SHALL remover o item do localStorage
3. WHEN um Guest_User altera a quantidade de um Cart_Item, THE Cart_System SHALL atualizar o localStorage
4. WHEN um Guest_User recarrega a página, THE Cart_System SHALL restaurar o carrinho do localStorage

### Requirement 3: Migração do Carrinho ao Fazer Login

**User Story:** Como um visitante que adicionou produtos ao carrinho, quero que meus itens sejam preservados quando eu fizer login, para que eu não perca minha seleção.

#### Acceptance Criteria

1. WHEN um Guest_User com Cart_Items no localStorage faz login, THE Cart_System SHALL iniciar o processo de Migration
2. WHEN a Migration é iniciada, THE Cart_System SHALL transferir todos os Cart_Items do localStorage para a tabela `cart_items` vinculados ao `user_id`
3. IF um Cart_Item do localStorage já existe no carrinho do banco (mesmo `product_id` e `size`), THEN THE Cart_System SHALL somar as quantidades
4. WHEN a Migration é concluída com sucesso, THE Cart_System SHALL limpar o localStorage
5. IF a Migration falha, THEN THE Cart_System SHALL manter os itens no localStorage e exibir mensagem de erro

### Requirement 4: Optimistic UI para Operações do Carrinho

**User Story:** Como um usuário, quero que o carrinho responda instantaneamente às minhas ações, para que a experiência seja fluida mesmo com latência de rede.

#### Acceptance Criteria

1. WHEN um usuário adiciona um Cart_Item, THE Cart_System SHALL atualizar a UI imediatamente antes da confirmação do servidor
2. WHEN um usuário remove um Cart_Item, THE Cart_System SHALL remover o item da UI imediatamente
3. WHEN um usuário altera a quantidade, THE Cart_System SHALL atualizar a UI imediatamente
4. THE Cart_System SHALL completar atualizações de UI em menos de 100 milissegundos
5. IF uma operação no servidor falha, THEN THE Cart_System SHALL executar Rollback para o estado anterior
6. WHEN um Rollback ocorre, THE Cart_System SHALL exibir mensagem de erro ao usuário

### Requirement 5: Sincronização Automática do Carrinho

**User Story:** Como um usuário autenticado, quero que meu carrinho seja sincronizado automaticamente entre dispositivos, para que eu possa começar a compra no celular e finalizar no computador.

#### Acceptance Criteria

1. WHEN um Authenticated_User adiciona um Cart_Item em um dispositivo, THE Cart_System SHALL tornar o item visível em todos os dispositivos do usuário
2. WHEN um Authenticated_User remove um Cart_Item em um dispositivo, THE Cart_System SHALL remover o item de todos os dispositivos
3. WHEN um Authenticated_User altera a quantidade em um dispositivo, THE Cart_System SHALL sincronizar a mudança em todos os dispositivos
4. THE Cart_System SHALL utilizar Supabase Realtime para sincronização automática

### Requirement 6: Segurança do Carrinho (RLS)

**User Story:** Como um usuário, quero ter certeza de que apenas eu posso ver e modificar meu carrinho, para que meus dados estejam protegidos.

#### Acceptance Criteria

1. THE Cart_System SHALL aplicar RLS na tabela `cart_items` para garantir isolamento por `user_id`
2. WHEN um Authenticated_User tenta ler Cart_Items, THE Cart_System SHALL retornar apenas itens onde `user_id` corresponde ao usuário autenticado
3. WHEN um Authenticated_User tenta criar um Cart_Item, THE Cart_System SHALL permitir apenas se o `user_id` corresponde ao usuário autenticado
4. WHEN um Authenticated_User tenta atualizar um Cart_Item, THE Cart_System SHALL permitir apenas se o `user_id` corresponde ao usuário autenticado
5. WHEN um Authenticated_User tenta deletar um Cart_Item, THE Cart_System SHALL permitir apenas se o `user_id` corresponde ao usuário autenticado

### Requirement 7: Persistência da Wishlist para Usuários Autenticados

**User Story:** Como um usuário autenticado, quero salvar produtos favoritos na wishlist, para que eu possa revisitá-los depois e decidir se vou comprar.

#### Acceptance Criteria

1. WHEN um Authenticated_User adiciona um produto à wishlist, THE Wishlist_System SHALL persistir o Wishlist_Item na tabela `wishlist_items` do Supabase
2. WHEN um Authenticated_User remove um produto da wishlist, THE Wishlist_System SHALL deletar o registro correspondente da tabela `wishlist_items`
3. WHEN um Authenticated_User acessa a página `/favoritos`, THE Wishlist_System SHALL carregar todos os Wishlist_Items do banco vinculados ao `user_id`
4. WHEN um Authenticated_User visualiza um produto, THE Wishlist_System SHALL indicar se o produto está na wishlist

### Requirement 8: Limite de Itens na Wishlist

**User Story:** Como um usuário, quero ser informado quando atingir o limite de itens na wishlist, para que eu saiba que preciso remover itens antes de adicionar novos.

#### Acceptance Criteria

1. THE Wishlist_System SHALL limitar cada usuário a 20 Wishlist_Items
2. WHEN um Authenticated_User tenta adicionar um Wishlist_Item e já possui 20 itens, THE Wishlist_System SHALL rejeitar a operação
3. WHEN a operação é rejeitada por limite, THE Wishlist_System SHALL exibir mensagem informando o limite de 20 itens
4. WHEN um Authenticated_User remove um Wishlist_Item, THE Wishlist_System SHALL permitir adicionar novos itens até o limite

### Requirement 9: Wishlist Local para Visitantes

**User Story:** Como um visitante não autenticado, quero marcar produtos como favoritos sem precisar fazer login, para que eu possa explorar a loja livremente.

#### Acceptance Criteria

1. WHEN um Guest_User adiciona um produto à wishlist, THE Wishlist_System SHALL armazenar o Wishlist_Item no localStorage
2. WHEN um Guest_User remove um produto da wishlist, THE Wishlist_System SHALL remover o item do localStorage
3. WHEN um Guest_User recarrega a página, THE Wishlist_System SHALL restaurar a wishlist do localStorage
4. THE Wishlist_System SHALL aplicar o limite de 20 itens também no localStorage

### Requirement 10: Migração da Wishlist ao Fazer Login

**User Story:** Como um visitante que marcou produtos como favoritos, quero que minha wishlist seja preservada quando eu fizer login, para que eu não perca meus produtos de interesse.

#### Acceptance Criteria

1. WHEN um Guest_User com Wishlist_Items no localStorage faz login, THE Wishlist_System SHALL iniciar o processo de Migration
2. WHEN a Migration é iniciada, THE Wishlist_System SHALL transferir todos os Wishlist_Items do localStorage para a tabela `wishlist_items` vinculados ao `user_id`
3. IF um Wishlist_Item do localStorage já existe no banco (mesmo `product_id`), THEN THE Wishlist_System SHALL ignorar o duplicado
4. IF a soma dos itens do localStorage e do banco exceder 20, THEN THE Wishlist_System SHALL manter apenas os 20 mais recentes
5. WHEN a Migration é concluída com sucesso, THE Wishlist_System SHALL limpar o localStorage

### Requirement 11: Segurança da Wishlist (RLS)

**User Story:** Como um usuário, quero ter certeza de que apenas eu posso ver e modificar minha wishlist, para que meus interesses sejam privados.

#### Acceptance Criteria

1. THE Wishlist_System SHALL aplicar RLS na tabela `wishlist_items` para garantir isolamento por `user_id`
2. WHEN um Authenticated_User tenta ler Wishlist_Items, THE Wishlist_System SHALL retornar apenas itens onde `user_id` corresponde ao usuário autenticado
3. WHEN um Authenticated_User tenta criar um Wishlist_Item, THE Wishlist_System SHALL permitir apenas se o `user_id` corresponde ao usuário autenticado
4. WHEN um Authenticated_User tenta deletar um Wishlist_Item, THE Wishlist_System SHALL permitir apenas se o `user_id` corresponde ao usuário autenticado

### Requirement 12: Validação de Integridade Referencial

**User Story:** Como desenvolvedor, quero garantir que Cart_Items e Wishlist_Items sempre referenciem produtos válidos, para que não haja dados órfãos no sistema.

#### Acceptance Criteria

1. THE Cart_System SHALL definir foreign key `product_id` na tabela `cart_items` referenciando `products.id`
2. THE Wishlist_System SHALL definir foreign key `product_id` na tabela `wishlist_items` referenciando `products.id`
3. WHEN um produto é deletado, THE Cart_System SHALL remover automaticamente todos os Cart_Items associados (CASCADE)
4. WHEN um produto é deletado, THE Wishlist_System SHALL remover automaticamente todos os Wishlist_Items associados (CASCADE)
5. WHEN um usuário é deletado, THE Cart_System SHALL remover automaticamente todos os Cart_Items associados (CASCADE)
6. WHEN um usuário é deletado, THE Wishlist_System SHALL remover automaticamente todos os Wishlist_Items associados (CASCADE)

### Requirement 13: Resolução de Conflitos Multi-Device

**User Story:** Como um usuário autenticado, quero que alterações simultâneas no carrinho em diferentes dispositivos sejam resolvidas de forma consistente, para que eu não perca dados ou veja estados inconsistentes.

#### Acceptance Criteria

1. WHEN um Authenticated_User altera um Cart_Item em dois dispositivos simultaneamente, THE Cart_System SHALL aplicar estratégia Last_Write_Wins baseada em timestamp
2. THE Cart_System SHALL incluir campo `updated_at` com timestamp em todas as operações de escrita na tabela `cart_items`
3. WHEN um Realtime_Event chega fora de ordem, THE Cart_System SHALL comparar timestamps e aplicar apenas eventos mais recentes
4. IF um Realtime_Event tem timestamp mais antigo que o estado local, THEN THE Cart_System SHALL ignorar o evento
5. WHEN um conflito é resolvido, THE Cart_System SHALL manter o estado consistente em todos os dispositivos do usuário

### Requirement 14: Identidade Única de Itens

**User Story:** Como desenvolvedor, quero garantir que não existam itens duplicados no carrinho ou wishlist, para que o sistema mantenha integridade de dados.

#### Acceptance Criteria

1. THE Cart_System SHALL definir constraint unique(product_id, size, user_id) na tabela `cart_items`
2. THE Wishlist_System SHALL definir constraint unique(product_id, user_id) na tabela `wishlist_items`
3. WHEN um Authenticated_User tenta adicionar um Cart_Item que já existe (mesmo product_id e size), THE Cart_System SHALL incrementar a quantidade do item existente
4. WHEN um Authenticated_User tenta adicionar um Wishlist_Item que já existe (mesmo product_id), THE Wishlist_System SHALL ignorar a operação silenciosamente
5. THE Cart_System SHALL tratar violações de constraint unique como operações de atualização, não como erros

### Requirement 15: Idempotência da Migration

**User Story:** Como desenvolvedor, quero garantir que o processo de migração seja seguro e possa ser executado múltiplas vezes sem duplicar dados, para que falhas parciais não corrompam o sistema.

#### Acceptance Criteria

1. WHEN a Migration é executada, THE Cart_System SHALL verificar se cada Cart_Item do localStorage já existe no banco antes de inserir
2. WHEN a Migration é executada, THE Wishlist_System SHALL verificar se cada Wishlist_Item do localStorage já existe no banco antes de inserir
3. THE Cart_System SHALL executar todas as operações de Migration dentro de uma transação do Supabase
4. IF a Migration falha no meio do processo, THEN THE Cart_System SHALL reverter todas as inserções parciais (rollback de transação)
5. WHEN a Migration é concluída com sucesso, THE Cart_System SHALL marcar o localStorage como migrado para evitar re-execução
6. THE Cart_System SHALL permitir que a Migration seja executada múltiplas vezes sem criar dados duplicados

### Requirement 16: Validação de Input de Quantidade

**User Story:** Como usuário, quero que o sistema valide as quantidades que eu insiro no carrinho, para que eu não possa adicionar valores inválidos que causem erros.

#### Acceptance Criteria

1. THE Cart_System SHALL validar que a quantidade mínima de um Cart_Item é 1
2. THE Cart_System SHALL validar que a quantidade máxima de um Cart_Item é 99
3. WHEN um usuário tenta definir quantidade menor que 1, THE Cart_System SHALL rejeitar a operação e exibir mensagem de erro
4. WHEN um usuário tenta definir quantidade maior que 99, THE Cart_System SHALL rejeitar a operação e exibir mensagem de erro
5. WHEN um usuário tenta definir quantidade com valor não-numérico, THE Cart_System SHALL rejeitar a operação e exibir mensagem de erro
6. WHEN um usuário tenta adicionar um Cart_Item, THE Cart_System SHALL validar que o product_id existe na tabela `products` antes de persistir

### Requirement 17: Retry Strategy para Operações Falhadas

**User Story:** Como usuário, quero que o sistema tente automaticamente reenviar operações que falharam por problemas temporários de rede, para que eu não precise repetir ações manualmente.

#### Acceptance Criteria

1. WHEN uma operação de escrita no banco falha com erro de rede, THE Cart_System SHALL tentar automaticamente até 2 vezes antes de reportar erro
2. THE Cart_System SHALL aguardar 500ms entre tentativas de retry
3. WHEN todas as tentativas de retry falham, THE Cart_System SHALL executar Rollback na UI e exibir mensagem de erro ao usuário
4. THE Cart_System SHALL aplicar Retry_Strategy apenas para erros de rede (timeout, connection refused)
5. THE Cart_System SHALL NOT aplicar retry para erros de validação ou constraint violations
6. WHEN um retry é bem-sucedido, THE Cart_System SHALL confirmar o estado na UI sem notificar o usuário

### Requirement 18: Source of Truth no Load Inicial

**User Story:** Como usuário autenticado, quero que o sistema sempre carregue meu carrinho do banco de dados ao abrir a aplicação, para que eu veja o estado mais atualizado independente do localStorage.

#### Acceptance Criteria

1. WHEN um Authenticated_User carrega a aplicação, THE Cart_System SHALL buscar o carrinho exclusivamente da tabela `cart_items` no banco
2. WHEN um Authenticated_User carrega a aplicação, THE Wishlist_System SHALL buscar a wishlist exclusivamente da tabela `wishlist_items` no banco
3. IF um Authenticated_User possui dados no localStorage, THE Cart_System SHALL ignorar o localStorage e usar apenas o banco como source of truth
4. WHEN a Migration é concluída com sucesso, THE Cart_System SHALL limpar completamente o localStorage para evitar conflitos futuros
5. WHEN um Guest_User carrega a aplicação, THE Cart_System SHALL usar o localStorage como source of truth

### Requirement 19: Versionamento de Estado para Optimistic UI

**User Story:** Como desenvolvedor, quero manter snapshots do estado anterior durante operações optimistic, para que rollbacks restaurem o estado correto em caso de falha.

#### Acceptance Criteria

1. WHEN uma operação optimistic é iniciada, THE Cart_System SHALL criar um snapshot do estado atual do carrinho
2. THE Cart_System SHALL manter uma fila de operações pendentes (pending operations) até confirmação do servidor
3. WHEN uma operação é confirmada pelo servidor, THE Cart_System SHALL remover o snapshot correspondente
4. WHEN uma operação falha, THE Cart_System SHALL restaurar o estado do snapshot anterior
5. THE Cart_System SHALL garantir que múltiplas operações pendentes sejam rastreadas independentemente
6. WHEN um Rollback é executado, THE Cart_System SHALL restaurar exatamente o estado anterior, incluindo quantidades e itens removidos

### Requirement 20: Re-sync Fallback para Desconexões

**User Story:** Como usuário autenticado, quero que o sistema sincronize automaticamente meu carrinho quando a conexão for restabelecida, para que eu sempre veja o estado mais atualizado.

#### Acceptance Criteria

1. WHEN a conexão Realtime do Supabase é perdida, THE Cart_System SHALL detectar a desconexão
2. WHEN a conexão Realtime é restabelecida, THE Cart_System SHALL executar um Re_sync completo buscando o estado atual do banco
3. THE Cart_System SHALL comparar o estado local com o estado do banco após Re_sync
4. IF o estado do banco for diferente do estado local, THEN THE Cart_System SHALL atualizar a UI com o estado do banco
5. THE Cart_System SHALL aplicar a mesma lógica de Re_sync para o Wishlist_System
6. WHEN um Re_sync é executado, THE Cart_System SHALL descartar operações pendentes que ainda não foram confirmadas

### Requirement 21: Debounce de Operações Rápidas

**User Story:** Como usuário, quero que o sistema agrupe múltiplos cliques rápidos no botão de quantidade, para que não sejam enviadas dezenas de requisições desnecessárias ao servidor.

#### Acceptance Criteria

1. WHEN um usuário altera a quantidade de um Cart_Item múltiplas vezes em menos de 500ms, THE Cart_System SHALL aplicar Debounce e enviar apenas a última alteração ao servidor
2. THE Cart_System SHALL atualizar a UI imediatamente para cada clique (optimistic)
3. WHEN o período de Debounce termina, THE Cart_System SHALL enviar uma única requisição com o valor final
4. THE Cart_System SHALL aplicar Debounce apenas para operações de atualização de quantidade
5. THE Cart_System SHALL NOT aplicar Debounce para operações de adicionar ou remover itens

### Requirement 22: Tratamento de Edge Cases de Produto

**User Story:** Como usuário, quero ser notificado quando produtos no meu carrinho ficarem indisponíveis, para que eu possa tomar decisões informadas antes de finalizar a compra.

#### Acceptance Criteria

1. WHEN um produto no carrinho fica fora de estoque, THE Cart_System SHALL exibir um aviso visual no Cart_Item indicando indisponibilidade
2. WHEN um produto no carrinho é deletado (CASCADE), THE Cart_System SHALL remover automaticamente o Cart_Item e notificar o usuário
3. WHEN um produto na wishlist é deletado (CASCADE), THE Wishlist_System SHALL remover automaticamente o Wishlist_Item
4. WHERE um produto teve alteração de preço, THE Cart_System SHALL exibir o preço atualizado no carrinho
5. WHEN o usuário acessa a página de checkout, THE Cart_System SHALL validar disponibilidade de todos os produtos e exibir avisos para itens indisponíveis

### Requirement 23: Cleanup Policy (Opcional)

**User Story:** Como administrador do sistema, quero definir políticas de limpeza para carrinhos e wishlists abandonados, para que o banco de dados não acumule dados obsoletos indefinidamente.

#### Acceptance Criteria

1. WHERE a política de cleanup está habilitada, THE Cart_System SHALL remover Cart_Items não atualizados há mais de 90 dias
2. WHERE a política de cleanup está habilitada, THE Wishlist_System SHALL remover Wishlist_Items não atualizados há mais de 365 dias
3. THE Cart_System SHALL executar cleanup através de job agendado (cron job ou Supabase Function)
4. THE Cart_System SHALL registrar em log a quantidade de itens removidos em cada execução de cleanup
5. WHERE a política de cleanup está desabilitada, THE Cart_System SHALL manter todos os itens indefinidamente
