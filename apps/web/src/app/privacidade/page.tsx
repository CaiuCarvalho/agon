import { Metadata } from "next";
import { ShieldCheck, Lock, Eye, FileText, UserCheck, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade e Segurança | Agon",
  description: "Conheça nossa política de privacidade e como protegemos seus dados pessoais na Agon.",
};

export default function PrivacidadePage() {
  return (
    <main className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-brasil py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <ShieldCheck className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="font-display text-5xl md:text-7xl text-white uppercase tracking-tighter italic font-black leading-none mb-6">
              PRIVACIDADE & <span className="text-secondary">SEGURANÇA</span>
            </h1>
            <p className="text-white/80 text-lg">
              Última atualização: 11 de abril de 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-16">
            
            {/* Introdução */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <FileText className="h-8 w-8 text-primary" />
                <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                  INTRODUÇÃO
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                A Agon ("nós", "nosso" ou "nossa") está comprometida em proteger sua privacidade e segurança. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nosso site e serviços.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política. Se você não concordar com qualquer parte desta política, por favor, não utilize nossos serviços.
              </p>
            </div>

            {/* Informações que Coletamos */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Eye className="h-8 w-8 text-primary" />
                <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                  INFORMAÇÕES QUE COLETAMOS
                </h2>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-xl text-foreground">1. Informações Fornecidas por Você</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Dados de Cadastro:</strong> Nome, e-mail, CPF, telefone, data de nascimento</li>
                  <li><strong>Dados de Endereço:</strong> CEP, rua, número, complemento, bairro, cidade, estado</li>
                  <li><strong>Dados de Pagamento:</strong> Informações de cartão de crédito (processadas de forma segura pelo Mercado Pago)</li>
                  <li><strong>Histórico de Compras:</strong> Produtos adquiridos, valores, datas e status de pedidos</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-xl text-foreground">2. Informações Coletadas Automaticamente</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador, páginas visitadas, tempo de permanência</li>
                  <li><strong>Cookies:</strong> Utilizamos cookies para melhorar sua experiência e personalizar conteúdo</li>
                  <li><strong>Dispositivo:</strong> Tipo de dispositivo, sistema operacional, resolução de tela</li>
                </ul>
              </div>
            </div>

            {/* Como Usamos Suas Informações */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
                <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                  COMO USAMOS SUAS INFORMAÇÕES
                </h2>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos suas informações pessoais para:
              </p>
              
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Processar e gerenciar seus pedidos e pagamentos</li>
                <li>Enviar confirmações de pedidos e atualizações de entrega</li>
                <li>Fornecer suporte ao cliente e responder suas dúvidas</li>
                <li>Personalizar sua experiência de compra</li>
                <li>Enviar comunicações de marketing (com seu consentimento)</li>
                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Melhorar nossos produtos e serviços</li>
              </ul>
            </div>

            {/* Compartilhamento de Informações */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <AlertCircle className="h-8 w-8 text-primary" />
                <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                  COMPARTILHAMENTO DE INFORMAÇÕES
                </h2>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Não vendemos suas informações pessoais. Compartilhamos seus dados apenas nas seguintes situações:
              </p>
              
              <div className="space-y-4">
                <div className="bg-muted/20 p-6 rounded-2xl border border-border/30">
                  <h3 className="font-bold text-lg text-foreground mb-2">Prestadores de Serviços</h3>
                  <p className="text-muted-foreground text-sm">
                    Compartilhamos informações com empresas que nos ajudam a operar nosso negócio, como processadores de pagamento (Mercado Pago), serviços de entrega, provedores de hospedagem e ferramentas de análise.
                  </p>
                </div>

                <div className="bg-muted/20 p-6 rounded-2xl border border-border/30">
                  <h3 className="font-bold text-lg text-foreground mb-2">Obrigações Legais</h3>
                  <p className="text-muted-foreground text-sm">
                    Podemos divulgar suas informações quando exigido por lei, ordem judicial ou processo legal, ou para proteger nossos direitos, propriedade ou segurança.
                  </p>
                </div>

                <div className="bg-muted/20 p-6 rounded-2xl border border-border/30">
                  <h3 className="font-bold text-lg text-foreground mb-2">Transações Comerciais</h3>
                  <p className="text-muted-foreground text-sm">
                    Em caso de fusão, aquisição ou venda de ativos, suas informações podem ser transferidas como parte da transação.
                  </p>
                </div>
              </div>
            </div>

            {/* Segurança dos Dados */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Lock className="h-8 w-8 text-primary" />
                <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                  SEGURANÇA DOS DADOS
                </h2>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais:
              </p>
              
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Criptografia SSL/TLS:</strong> Todas as comunicações são criptografadas</li>
                <li><strong>Autenticação Segura:</strong> Sistema de autenticação via Supabase com tokens JWT</li>
                <li><strong>Pagamentos Seguros:</strong> Processamento via Mercado Pago (PCI DSS compliant)</li>
                <li><strong>Acesso Restrito:</strong> Apenas pessoal autorizado tem acesso aos dados</li>
                <li><strong>Monitoramento:</strong> Monitoramento contínuo de atividades suspeitas</li>
                <li><strong>Backups Regulares:</strong> Backups automáticos para prevenir perda de dados</li>
              </ul>

              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 mt-6">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Importante:</strong> Nenhum método de transmissão pela internet ou armazenamento eletrônico é 100% seguro. Embora nos esforcemos para proteger suas informações, não podemos garantir segurança absoluta.
                </p>
              </div>
            </div>

            {/* Seus Direitos */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                  SEUS DIREITOS (LGPD)
                </h2>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                  <h4 className="font-bold text-sm text-foreground mb-2">✓ Acesso</h4>
                  <p className="text-xs text-muted-foreground">Solicitar cópia de seus dados pessoais</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                  <h4 className="font-bold text-sm text-foreground mb-2">✓ Correção</h4>
                  <p className="text-xs text-muted-foreground">Corrigir dados incompletos ou incorretos</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                  <h4 className="font-bold text-sm text-foreground mb-2">✓ Exclusão</h4>
                  <p className="text-xs text-muted-foreground">Solicitar exclusão de seus dados</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                  <h4 className="font-bold text-sm text-foreground mb-2">✓ Portabilidade</h4>
                  <p className="text-xs text-muted-foreground">Receber seus dados em formato estruturado</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                  <h4 className="font-bold text-sm text-foreground mb-2">✓ Revogação</h4>
                  <p className="text-xs text-muted-foreground">Revogar consentimento a qualquer momento</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-xl border border-border/30">
                  <h4 className="font-bold text-sm text-foreground mb-2">✓ Oposição</h4>
                  <p className="text-xs text-muted-foreground">Opor-se ao tratamento de dados</p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mt-6">
                Para exercer seus direitos, entre em contato conosco através do e-mail: <strong className="text-foreground">privacidade@agon.com.br</strong>
              </p>
            </div>

            {/* Cookies */}
            <div className="space-y-6">
              <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                COOKIES E TECNOLOGIAS SIMILARES
              </h2>
              
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para:
              </p>
              
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Manter você conectado durante sua sessão</li>
                <li>Lembrar suas preferências e configurações</li>
                <li>Analisar o desempenho do site</li>
                <li>Personalizar conteúdo e anúncios</li>
              </ul>

              <p className="text-muted-foreground text-sm mt-4">
                Você pode gerenciar cookies através das configurações do seu navegador. Note que desabilitar cookies pode afetar a funcionalidade do site.
              </p>
            </div>

            {/* Retenção de Dados */}
            <div className="space-y-6">
              <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                RETENÇÃO DE DADOS
              </h2>
              
              <p className="text-muted-foreground leading-relaxed">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
              </p>
              
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Dados de Conta:</strong> Enquanto sua conta estiver ativa</li>
                <li><strong>Dados de Pedidos:</strong> 5 anos (conforme legislação fiscal)</li>
                <li><strong>Dados de Marketing:</strong> Até você revogar o consentimento</li>
                <li><strong>Logs de Acesso:</strong> 6 meses (conforme Marco Civil da Internet)</li>
              </ul>
            </div>

            {/* Menores de Idade */}
            <div className="space-y-6">
              <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                MENORES DE IDADE
              </h2>
              
              <p className="text-muted-foreground leading-relaxed">
                Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações pessoais de menores. Se você é pai ou responsável e acredita que seu filho nos forneceu informações pessoais, entre em contato conosco.
              </p>
            </div>

            {/* Alterações na Política */}
            <div className="space-y-6">
              <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                ALTERAÇÕES NESTA POLÍTICA
              </h2>
              
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas publicando a nova política em nosso site e atualizando a data de "Última atualização" no topo desta página.
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                Recomendamos que você revise esta política periodicamente para se manter informado sobre como protegemos suas informações.
              </p>
            </div>

            {/* Contato */}
            <div className="space-y-6 bg-muted/20 p-8 rounded-3xl border border-border/30">
              <h2 className="font-display text-3xl uppercase tracking-tighter italic font-black">
                ENTRE EM CONTATO
              </h2>
              
              <p className="text-muted-foreground leading-relaxed">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre nossas práticas de dados, entre em contato conosco:
              </p>
              
              <div className="space-y-3 text-muted-foreground">
                <p><strong className="text-foreground">E-mail:</strong> privacidade@agon.com.br</p>
                <p><strong className="text-foreground">Telefone:</strong> (11) 99999-0000</p>
                <p><strong className="text-foreground">Endereço:</strong> São Paulo, SP - Brasil</p>
                <p><strong className="text-foreground">Horário de Atendimento:</strong> Segunda a Sexta, 9h às 18h</p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
