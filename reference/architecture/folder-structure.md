# Estrutura Padrão de Pastas (Folder Structure)

A organização reflete as raízes de nosso Monorepo corporativo em Turborepo, isolando as regras por domínios consistentes.

## Árvore Principal do Monorepo

```text
agon/
├── apps/
│   └── web/            # Código da aplicação core (Next.js principal Front/AdminBack)
├── packages/
│   ├── config/         # Configurações globais partilhadas (Prettier, Eslint)
│   ├── ui/             # (Opcional) Design System isolado de componentes agnósticos
│   └── utils/          # Handlers matemáticos ou formato de datas universais (Types)
├── reference/          # ESTUDOS: Specs de negócio, engenharia, SDD
└── package.json        # Workspace global NPM definitions
```

## Aplicação Web (`apps/web/src`)

A estrutura segue o novo isolamento de source, e separação horizontal:
```text
src/
├── app/                  # Roteamento central Next.js. Onde as Views vivem. Somente "page.tsx" e "layout.tsx"
├── components/           # Componentes reusáveis desacoplados de estado global
│   ├── ui/               # Botões genéricos, Campos de Texto
│   ├── auth/             # Fragmentos isolados do domínio de Auth
│   └── checkout/         # Fragmentos de negócio (Resumos de ordens e formulários complexos)
├── lib/                  # Código modular independente: clientes BD, utilitários puros 
├── hooks/                # Custom React Hooks que orquestram estados complexos front-side
├── context/              # Contextos globais ou wrappers de providers
└── types/                # Coleção local de TS Intersect definition caso ZOD não provenha
```

## Regras de Organização
- **Proibido imports cruzados instáveis:** Arquivos de components locais não importam components de outros domínios de negócio restritos, apenas globais.
- A pasta `app` detém exclusivamente o modelo infraestrutural das rotas; o *business logic* contido neles deve ser delegado para hooks, factories, ou Server Actions presentes em `lib/actions` ou pastas relativas as lógicas.
