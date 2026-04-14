# Imagens da Seleção Brasileira

Este diretório contém as imagens oficiais do produto "Brasil" (Camisa da Seleção Brasileira).

## Imagens Disponíveis

| Arquivo | Tamanho | Descrição |
|---------|---------|-----------|
| `vini.jn.camisaselecao.avif` | 94.9 KB | **Imagem principal** - Vini Jr. com a camisa |
| `paqueta.camisaselecao.avif` | 105.3 KB | Paquetá com a camisa |
| `selecao1.avif` | 382.6 KB | Imagem da seleção |
| `10977200A3.avif` | 173.0 KB | Detalhe do produto |
| `10977200A5.avif` | 396.2 KB | Detalhe do produto |
| `10977200A6.avif` | 637.2 KB | Detalhe do produto (maior) |
| `10977200A7.avif` | 177.2 KB | Detalhe do produto |
| `10977200A8.avif` | 163.9 KB | Detalhe do produto |

**Total**: 8 imagens | **Tamanho total**: ~2.1 MB

## Formato

- **Formato**: AVIF (AV1 Image File Format)
- **Vantagens**: 
  - Compressão superior ao JPEG/PNG (~50% menor que JPEG)
  - Suporte a transparência
  - Melhor qualidade com menor tamanho
  - Suportado por navegadores modernos
- **Compatibilidade**: Chrome 85+, Firefox 93+, Safari 16+, Edge 121+
- **Fallback**: Next.js Image component fornece WebP/JPEG automaticamente

## Uso no Banco de Dados

```sql
-- Produto Brasil (slug: 'brasil')
-- Atualizar com: supabase/update-brasil-product-images.sql

UPDATE products 
SET 
  image_url = '/products/selecao/vini.jn.camisaselecao.avif',
  images = '[
    "/products/selecao/vini.jn.camisaselecao.avif",
    "/products/selecao/paqueta.camisaselecao.avif",
    "/products/selecao/selecao1.avif",
    "/products/selecao/10977200A3.avif",
    "/products/selecao/10977200A5.avif",
    "/products/selecao/10977200A6.avif",
    "/products/selecao/10977200A7.avif",
    "/products/selecao/10977200A8.avif"
  ]'::jsonb
WHERE slug = 'brasil';
```

## Otimização

As imagens já estão otimizadas em formato AVIF. Não é necessário processamento adicional.

## Acesso

- **Desenvolvimento**: `http://localhost:3000/products/selecao/[nome-arquivo]`
- **Produção**: `https://seu-dominio.com/products/selecao/[nome-arquivo]`

## Atualização

Para atualizar as imagens:
1. Substitua os arquivos neste diretório (mantenha os mesmos nomes)
2. **Se URLs mudaram**: Execute `supabase/update-brasil-product-images.sql`
3. **Se apenas substituiu arquivos**: Não precisa atualizar banco de dados
4. Limpe o cache do navegador (Ctrl+F5) ou CDN se em produção
5. Faça commit das mudanças

### Uso no Frontend

```tsx
// SEMPRE use o componente Image do Next.js
import Image from 'next/image';

<Image
  src="/products/selecao/vini.jn.camisaselecao.avif"
  alt="Camisa Seleção Brasileira"
  width={800}
  height={1000}
  priority // Para imagem principal
/>
```

**⚠️ NUNCA use `<img>` tag diretamente** - o componente Image fornece:
- Otimização automática
- Lazy loading
- Fallback para navegadores antigos
- Responsive images

---

**Última atualização**: 2026-04-14
