import React from 'react';
import { Edit3, MousePointer, Award, ArrowRight } from 'lucide-react';
export const ProcessSection: React.FC = () => {
  const steps = [{
    number: "01",
    icon: Edit3,
    title: "Componha sua música",
    description: "Use nosso editor intuitivo com IA para criar letras incríveis. Adicione áudios e colabore em tempo real.",
    features: ["Editor especializado", "IA criativa", "Rascunhos com áudio"]
  }, {
    number: "02",
    icon: MousePointer,
    title: "Registre em 1 clique",
    description: "Com um clique, geramos o hash criptográfico e timestamp da sua obra para garantir a anterioridade.",
    features: ["Hash SHA-256", "Timestamp seguro", "Prova de integridade"]
  }, {
    number: "03",
    icon: Award,
    title: "Receba seu certificado",
    description: "Certificado PDF válido juridicamente emitido em até 5 minutos, pronto para qualquer necessidade legal.",
    features: ["Válido juridicamente", "PDF profissional", "Entrega em 5 min"]
  }];
  return <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-black" />
      
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(34 197 94) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Como <span className="text-primary">funciona</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Processo simples e rápido para proteger suas criações musicais
          </p>
        </div>
        
        <div className="space-y-12 md:space-y-0">
          {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          return <div key={index} className="relative">
                <div className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Content */}
                  <div className={`space-y-6 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-6xl font-bold text-primary/20">
                        {step.number}
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-green-400/20 rounded-2xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-3xl md:text-4xl font-bold text-white">
                        {step.title}
                      </h3>
                      <p className="text-xl text-gray-400 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {/* Features list */}
                      <div className="flex flex-wrap gap-3">
                        {step.features.map((feature, featureIndex) => <div key={featureIndex} className="glass-card px-4 py-2 rounded-full border border-primary/20 text-sm text-primary font-medium">
                            {feature}
                          </div>)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual */}
                  <div className={`relative ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                    
                    
                    {/* Step connector */}
                    {!isLast && <div className="hidden md:block absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <ArrowRight className="w-8 h-8 text-primary/30 rotate-90" />
                      </div>}
                  </div>
                </div>
                
                {/* Mobile connector */}
                {!isLast && <div className="md:hidden flex justify-center py-8">
                    <ArrowRight className="w-8 h-8 text-primary/30 rotate-90" />
                  </div>}
              </div>;
        })}
        </div>
      </div>
    </section>;
};