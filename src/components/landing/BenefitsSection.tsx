import React from 'react';
import { Shield, Zap, Sparkles } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: Zap,
      title: "Registro Autoral Imediato",
      description: "Certificado em até 5 minutos com hash e timestamp válido juridicamente. Proteja sua criação instantaneamente.",
      highlight: "5 minutos"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Suas letras e áudios são criptografados e armazenados com prova de integridade. Tecnologia blockchain para máxima proteção.",
      highlight: "100% seguro"
    },
    {
      icon: Sparkles,
      title: "IA Criativa",
      description: "Gere temas, rimas e use bases musicais para acelerar sua criatividade. Inteligência artificial a serviço da sua música.",
      highlight: "IA avançada"
    }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/3 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Por que escolher a <span className="text-primary">Compuse</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A única plataforma que combina criatividade, tecnologia e proteção jurídica em um só lugar
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group glass-card p-8 rounded-2xl border border-gray-800/50 hover:border-primary/30 transition-all duration-500 hover:scale-105 relative overflow-hidden"
              >
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6 relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-green-400/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    
                    {/* Highlight badge */}
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-green-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                      {benefit.highlight}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  
                  <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {benefit.description}
                  </p>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 rounded-2xl transition-all duration-500" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};