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
      
      {/* Decorative elements - blur reduzido em mobile para performance */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-xl lg:blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/3 rounded-full blur-xl lg:blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Por que escolher a <span className="text-primary">Compuse</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A única plataforma que combina criatividade, tecnologia e proteção jurídica em um só lugar
          </p>
        </div>
        
      </div>
    </section>
  );
};