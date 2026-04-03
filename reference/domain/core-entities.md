# Core Entities (Entidades Principais)

Nossa centralização de dados estáticos para assegurar lógica limpa no banco e tipagens puras na interface gráfica do e-commerce esportivo baseiam-se em quatro raízes nucleares:

## User (Usuário Principal)
O arquétipo abstrato universal que consome ativamente o Agon. Representa em vias de fato a junção purificada das autenticações de operadoras externas com identificadores vitais. Pelo isolamento funcional de segurança não retém ordens ou pagamentos na sua "forma física", apenas as interliga no esquema estrutural do Next.js via Relacional B2C. Pode deter graus de permissões escaladas até níveis B2B (Administradores/Operadores da arquitetura loja).

## Product (Produto da Marca)
A representação estática base de um artigo real, como as camisas de elite, e seus preços base. Todo `Product` contém em sua raiz invariável:
- **Metadados Intactos:** Nomenclatura, Marca originária.
- **Variações Dimensivas e Qualitativas:** Arrays fechadas ditando cores e limitadores nativos permitidos (Tamanhos exatos operacionais, S, M, L, XL).
- **Controlador Base Tático:** Preços mestres (A única verdade oficial aceita e cotada), limites de estocagens máximas e rastros das fotos hospedadas em bucket CDN próprio.

## Order / Pedido Transacional (A Consagração)
Se sobrepõe ao ciclo volátil. Após encerramento das compras o checkout dispara e trava uma `Order` inquebrável, congelada por temporalidade exata representando os fatos contábeis isolando os objetos no tempo; Se a camisa do Brasil mudar do catálogo ou escalar de R$100 para R$500 um mês depois da batida, as Ordens anteriores passadas recusam-se a perder os valores transacionados e sua conformidade real da nota. Uma ordem nunca reflete os preços flexíveis de hoje;

## Cart / Checkout Object (O Carrinho em Espera)
Um agrupamento frágil otimista no front da Web Application e temporário ativamente gerido sem vínculos concretos ou débito final. Aglutina blocos em um estado flutuante com a capacidade de serem dizimados pela ausência da confirmação definitiva. Servirá intimamente de input passageiro validável aos validadores *Zod*.
