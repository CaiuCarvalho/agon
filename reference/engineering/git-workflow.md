# Fluxo de Trabalho Git (Workflow)

## Trabalhando com Branches (Ramificações)
Implementaremos um fluxo linear flexível centrado em mesclar código validado no ponto seguro absoluto.
* **Master (`main`):** A entidade blindada e segura da implantação de produção (PROD environment). Nunca realizamos pull requests desprotegidos ou commits diretos via prompt CLI contra ela. 
* **Branch de Funcionalidades (`feat/o-nome-da-feature-do-spec`):** Todo e perante desenvolvimento atrelado a construção declarada nos specs de negócio ocorre aqui. (Ex: `feat/shopping-cart-validation`).
* **Correções Quentes ou Isoladas (`fix/ticket-identificado`):** Remendos direcionados a contornar erros reportados que furaram validações corrompidas do sistema ativo. Foco total em mutações pontuais rápidas (Ex: `fix/mobile-navbar-alignment`).
* **Trabalhos Mecânicos / Reescrita (`refactor/limpeza`, `chore/upgrades`):** Foco limpo interno não englobado por visibilidade client-side de negócio. Previne o debito em refatoramento assíncrono.

## Processo Seguro de Commits
Imposição das mensagens curtas imperativas sob formato restrito de Conventional Commits, possibilitando automações limpas e geração de changelog sem ruído humano adicional.
* `feat:` Adição de traço, layout ou funcionalidade inédita.
* `fix:` Emenda de defeito rastreado.
* `docs:` Modificações explícitas no repositório de refência e documentação. (Arquivos sob `/reference` ou comments in-code).
* `chore:` Manutenções, packages, limpeza estrutural irrelevante à build lógico frontal.
*Exemplo perfeito: "feat: adicao do formulario de perfil limpo ao router app"*

## PRs (Pull Requests) - Protocolo de Defesa
1. **Atômico e Direto:** Um (1) PR encosta apenas e rigidamente num domínio lógico central não devendo conter reescritas misturadas acopladas de múltiplos andares (Ex: É indesejável arrumar rodapé web E criar modelo de database do gateway de SMS no mesmo PR global se são desassociados do objetivo originário).
2. Devem possuir a sintaxe relacional nos PRs direcionandos aos issues gerados e ligar com as specs.
3. Mesclagem em Master barrada estritamente até Check Estático em TS (`tsc --noEmit`) ser chancelado por falha 0%.
