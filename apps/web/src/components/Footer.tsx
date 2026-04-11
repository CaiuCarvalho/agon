import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gradient-brasil py-16 text-primary-foreground">
      <div className="container mx-auto">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-display text-2xl tracking-wider uppercase italic font-black">
              AGON
            </h3>
            <p className="mt-3 text-sm text-primary-foreground/70">
              A loja oficial do torcedor de elite. Qualidade, paixão e entrega rápida.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg tracking-wide">Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li><Link href="/" className="transition-colors hover:text-secondary">Início</Link></li>
              <li><Link href="/products" className="transition-colors hover:text-secondary">Produtos</Link></li>
              <li><Link href="#categorias" className="transition-colors hover:text-secondary">Categorias</Link></li>
              <li><Link href="#depoimentos" className="transition-colors hover:text-secondary">Depoimentos</Link></li>
              <li><Link href="/privacidade" className="transition-colors hover:text-secondary">Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg tracking-wide">Atendimento</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li>contato@agon.com.br</li>
              <li>(11) 99999-0000</li>
              <li>Seg a Sex, 9h às 18h</li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg tracking-wide">Redes Sociais</h4>
            <div className="mt-3 flex gap-4">
              <Link href="#" className="text-primary-foreground/70 transition-colors hover:text-secondary">
                Instagram
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/50">
          © 2026 Agon. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
