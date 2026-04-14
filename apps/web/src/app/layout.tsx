import type { Metadata } from "next";
import Script from "next/script";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/lib/react-query/QueryProvider";
import { MigrationProgress } from "@/components/cart/MigrationProgress";
import { RealtimeStatus } from "@/components/cart/RealtimeStatus";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agon — A Loja do Torcedor",
  description: "A melhor loja de produtos temáticos da Seleção Brasileira e artigos de futebol.",
  keywords: ["futebol", "brasil", "copa do mundo", "camisa", "seleção"],
  authors: [{ name: "Agon" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-MCVPTPL3');`
          }}
        />
      </head>
      <body className="font-body antialiased text-foreground bg-background">
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MCVPTPL3" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
          }}
        />
        <QueryProvider>
          <AuthProvider>
            <GoogleAnalytics />
            <MigrationProgress />
            <RealtimeStatus />
            {children}
            <Toaster />
            <Sonner />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
