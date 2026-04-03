# Design System

O núcleo modular da apresentação estética da Loja do Torcedor "Agon". Governa tipologia unificada, ritmos espaciais e a representação de valor agregado abstrato premium através das utilidades limpas presentes na framework integrada.

## Matriz Tipográfica Baseativa
Toda declaração de design em telas é rigidamente atrelada às definições contidas no root (`globals.css`) que encapsulam classes no frontend purificando o desenvolvimento massivo.

* **Sans Regular de Leitura Integral/Corpo Principal:** Letra livre limpa destituída de serifas invasivas (Inter, Lato ou System Native Defaults da Web). Promove o leito neutro de leitura de conteúdos, listas ou dados gerais.
* **Componente Titular / Display Frontal:** Fontes intensas, arrojadas marcadas por alta presença corpórea (ex: Montserrat/Outfit Font Weights massivos 700+). É canalizado em heróis de vendas, slogans imperativos ou marcadores absolutos criando percepção vigorosa desportiva moderna.

## Regimento de Paleta Cromática e Variação Estrita
As interfaces assumem as mutações globais que Tailwind oferece a partir de sua extensão. O desvio dessa abstração injetando HEX color arbitrário arruina os *Themes*.

* Cargas Cromáticas de Fundo Global Base (Backgrounds): `bg-background`. Extremamente leves e imersivos que destacam o produto real.
* Contrastes Nativos Para a Visão (Foreground): `text-foreground`. Textos opacos severos mantendo taxas de luminosidade acessíveis sob qualquer contraste ACAA/WCAG 2.1.
* Acento Identificador (Primary): O elemento representativo vibrante. Ícones e CTAs absorvem gradientes ou cores primárias sólidas injetando alto valor visual à visão neutra exterior, simulando identidades premium como Seleção Nacional unindo tons intensos vivos. Evita saturações opacas perante interfaces dark se for adaptável.

## Espaçamentos Modulares & Rhythm Constraint Grid Limit
Acompanhamos na essencia um grid limpo regido nos `4pt sistem ticks` subjacente sem mágicas matemáticas quebradas. Escalonando com `gap-x`, `py-x`, `mt-x`.
* Preenchimentos apertados microscópicos para coesão inter-filha de cards menores baseados sempre em pares contidos (ex `p-2` `p-4`).
* Distanciamento exterior macro de grandes blocos fluídos para conferir fôlego às seções globais usando multiplos pesados do 4pt system ou relacional de base VW/VH do Next sem recorrer arbitrary values impuros em classes em casos corriqueiros.
* A simetria reflete a excelência técnica percebível e imperfeição é imediatamente repudiada caso listagens variem.
