# Princípios do Produto

## Princípios que guiam o produto
1. **Foco Centrado no Usuário (User-Centric):** Toda feature começa sendo desenhada pensando na conversão indolor por parte do cliente, a experiência deve ser ininterrupta.
2. **Performance Implacável:** Respostas abaixo de limites perceptíveis para operações comuns. Tempo é engajamento e dinheiro.
3. **Escalabilidade Consciente:** Código escrito sob alta simplicidade para aguentar carga e extensões lógicas de novos provedores de frete/pagamento.
4. **Veracidade de Dados (Zero-Lost-Orders):** O sistema sob nenhuma hipótese deve falhar assincronamente com o pagamento; transações são sagradas.

## O que devemos evitar (Anti-Patterns do Produto)
1. Adicionar etapas extras desnecessárias no funil de *Checkout*.
2. Excesso de plugins genéricos não gerenciados (bloatware) que sujem o código client-side.
3. Bloquear o uso do site (Loaders full-screen bloqueantes) — a UI deve sempre optar por renderização esqueleto, animação fluida otimista.
4. Retenção de estado de negócio essencial no client-side vazio de garantias que compromete segurança ou rehidratação (Data flow instável).
