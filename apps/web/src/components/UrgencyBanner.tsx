"use client";
import { Flame, Clock } from "lucide-react";

const UrgencyBanner = () => {
  return (
    <section className="bg-gradient-urgency py-4 overflow-hidden">
      <div className="flex animate-slide-in items-center gap-8 whitespace-nowrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="flex items-center gap-2 font-display text-lg uppercase tracking-wider text-secondary-foreground">
            <Flame className="h-5 w-5" />
            Oferta relâmpago — até 40% OFF
            <Clock className="h-5 w-5" />
            Últimas unidades disponíveis
          </span>
        ))}
      </div>
    </section>
  );
};

export default UrgencyBanner;
