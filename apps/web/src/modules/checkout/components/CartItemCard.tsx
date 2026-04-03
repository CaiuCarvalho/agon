// Componente Burro Pura Renderização Exibitiva sem dependência de estados Lógicos
import { CartItem } from "../contracts";

import { Trash2 } from "lucide-react";

interface CartItemCardProps {
  item: CartItem;
  onRemove: (productId: string, size: string) => void;
  isRemoving?: boolean;
}

export function CartItemCard({ item, onRemove, isRemoving }: CartItemCardProps) {
  return (
    <div className={`group flex gap-5 bg-white border border-border/40 p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-border/80 ${isRemoving ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}>
      
      {/* Imagem do Produto com Aspect Ratio Impecável */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted/30">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="h-full w-full object-cover object-center mix-blend-multiply" 
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between py-1">
        {/* Header do Card: Título e Categoria/Tamanho */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="font-display font-bold text-sm tracking-tight text-foreground line-clamp-2 leading-tight">
              {item.name}
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
              Tamanho: <span className="text-foreground">{item.size}</span>
            </p>
          </div>
          <button 
            onClick={() => onRemove(item.productId, item.size)}
            disabled={isRemoving}
            className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 active:scale-90 disabled:opacity-50"
            aria-label="Remover item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Footer do Card: Preço e Quantidade */}
        <div className="flex items-end justify-between mt-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground mb-0.5">Preço Unitário</span>
            <span className="font-body font-black text-lg text-foreground leading-none">
              R$ {item.price.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          {/* Badge de Quantidade Style Nike/Premium */}
          <div className="flex items-center justify-center bg-muted/40 border border-border/50 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] uppercase font-black tracking-widest text-foreground">
              Qtd: {item.quantity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
