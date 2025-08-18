import React from 'react';
import { Shield, Scale, FileCheck, Lock } from 'lucide-react';

export const LegalProofSection: React.FC = () => {
  const legalFeatures = [
    {
      icon: Scale,
      title: "Lei 9.610/98",
      subtitle: "Lei de Direitos Autorais",
      description: "Respaldo completo pela legislação brasileira de direitos autorais"
    },
    {
      icon: FileCheck,
      title: "Art. 369 do CPC",
      subtitle: "Código de Processo Civil",
      description: "Documento eletrônico com validade probatória reconhecida"
    },
    {
      icon: Lock,
      title: "MP 2.200-2/2001",
      subtitle: "Medida Provisória",
      description: "Certificação digital e assinatura eletrônica com força legal"
    },
    {
      icon: Shield,
      title: "Hash + Timestamp",
      subtitle: "Prova Técnica",
      description: "Tecnologia criptográfica que garante integridade e anterioridade"
    }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950" />
      
      {/* Legal pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/20 to-green-400/20 px-6 py-3 rounded-full border border-primary/30">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Garantia Legal</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            <span className="text-primary">Validade jurídica</span> comprovada
          </h2>
          
          <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Nosso certificado é <strong className="text-white">amparado pela Lei 9.610/98 (Lei de Direitos Autorais)</strong>, 
            pelo <strong className="text-white">art. 369 do CPC</strong> e pela <strong className="text-white">MP 2.200-2/2001</strong>. 
            Hash e timestamp garantem a integridade e a anterioridade da sua obra em qualquer disputa judicial.
          </p>
        </div>
        
        {/* Legal features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {legalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group glass-card p-6 rounded-2xl border border-gray-800/50 hover:border-primary/30 transition-all duration-500 text-center"
              >
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-green-400/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">
                  {feature.title}
                </h3>
                
                <p className="text-primary text-sm font-semibold mb-3">
                  {feature.subtitle}
                </p>
                
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Certificate preview */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 space-y-6">
              {/* Certificate header */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-green-400 rounded-full flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Certificado de Registro Autoral
                </h3>
                <p className="text-gray-400">
                  Documento com validade jurídica plena
                </p>
              </div>
              
              {/* Certificate content mockup */}
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Obra</div>
                    <div className="h-3 bg-primary/30 rounded animate-pulse w-3/4" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Autor</div>
                    <div className="h-3 bg-gray-700 rounded w-2/3" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Hash SHA-256</div>
                    <div className="h-3 bg-gray-700 rounded w-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Timestamp</div>
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
                
                {/* Verification badge */}
                <div className="flex items-center justify-center pt-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-green-400 text-black px-4 py-2 rounded-full font-semibold">
                    <Shield className="w-4 h-4" />
                    <span>Verificado e Válido</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trust indicators */}
        <div className="mt-16 text-center space-y-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Aceito em tribunais</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Certificado digital ICP-Brasil</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Tecnologia blockchain</span>
            </div>
          </div>
          
          <p className="text-gray-400 max-w-2xl mx-auto">
            Nossa tecnologia é auditada por especialistas em direito digital e criptografia. 
            Garantimos a máxima segurança jurídica para suas criações musicais.
          </p>
        </div>
      </div>
    </section>
  );
};