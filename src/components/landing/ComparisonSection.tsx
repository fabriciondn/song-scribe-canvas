import React from 'react';
import { Check, X, Star } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const features = [
    {
      name: "Registro em até 5 min",
      compuse: true,
      competitors: false,
      highlight: true
    },
    {
      name: "Certificado digital válido",
      compuse: true,
      competitors: true,
      highlight: false
    },
    {
      name: "IA para compor",
      compuse: true,
      competitors: false,
      highlight: true
    },
    {
      name: "Rascunho com áudio+texto",
      compuse: true,
      competitors: false,
      highlight: true
    },
    {
      name: "Colaboração em tempo real",
      compuse: true,
      competitors: "partial",
      highlight: false
    },
    {
      name: "Tecnologia blockchain",
      compuse: true,
      competitors: false,
      highlight: true
    },
    {
      name: "Suporte 24/7",
      compuse: true,
      competitors: false,
      highlight: false
    }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950/50 to-black" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-green-500/3 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Por que a Compuse é <span className="text-primary">superior</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Compare nossa plataforma com as principais alternativas do mercado
          </p>
        </div>
        
        {/* Comparison Table */}
        <div className="glass-card rounded-2xl border border-gray-800/50 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-400">Funcionalidade</h3>
            </div>
            <div className="p-6 bg-gradient-to-r from-primary/10 to-green-400/10 border-x border-primary/20">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">Compuse</h3>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-400">Concorrentes</h3>
            </div>
          </div>
          
          {/* Features */}
          <div className="divide-y divide-gray-800">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`grid grid-cols-3 hover:bg-gray-900/50 transition-colors duration-300 ${
                  feature.highlight ? 'bg-primary/5' : ''
                }`}
              >
                {/* Feature name */}
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${feature.highlight ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {feature.name}
                    </span>
                    {feature.highlight && (
                      <div className="bg-gradient-to-r from-primary to-green-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                        EXCLUSIVO
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Compuse */}
                <div className="p-6 bg-gradient-to-r from-primary/5 to-green-400/5 border-x border-primary/10">
                  <div className="flex items-center justify-center">
                    {feature.compuse ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-6 h-6 text-primary" />
                        <span className="text-primary font-semibold">Sim</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="w-6 h-6 text-red-400" />
                        <span className="text-red-400 font-semibold">Não</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Competitors */}
                <div className="p-6">
                  <div className="flex items-center justify-center">
                    {feature.competitors === true ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-6 h-6 text-green-400" />
                        <span className="text-green-400 font-semibold">Sim</span>
                      </div>
                    ) : feature.competitors === "partial" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-black font-bold text-xs">~</span>
                        </div>
                        <span className="text-yellow-500 font-semibold">Parcial</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="w-6 h-6 text-red-400" />
                        <span className="text-red-400 font-semibold">Não</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer note */}
          <div className="p-6 bg-gradient-to-r from-primary/10 to-green-400/10 border-t border-primary/20">
            <p className="text-center text-sm text-gray-400">
              * Comparação baseada nas principais plataformas de registro autoral disponíveis no Brasil
            </p>
          </div>
        </div>
        
        {/* Trust badges */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Tempo médio", value: "5 min", color: "primary" },
            { label: "Segurança", value: "100%", color: "green-400" },
            { label: "Usuários ativos", value: "10K+", color: "primary" },
            { label: "Certificados emitidos", value: "50K+", color: "green-400" }
          ].map((stat, index) => (
            <div key={index} className="text-center space-y-2">
              <div className={`text-3xl md:text-4xl font-bold ${stat.color === 'primary' ? 'text-primary' : 'text-green-400'}`}>
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};