import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Shield, Sparkles } from 'lucide-react';

interface FinalCTASectionProps {
  onGetStarted: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onGetStarted }) => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-green-500/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Main CTA */}
        <div className="space-y-8">
          {/* Urgency badge */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/20 to-green-400/20 px-6 py-3 rounded-full border border-primary/30">
            <Clock className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-primary font-semibold">Proteja sua música agora</span>
          </div>
          
          {/* Headline */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-white">Sua música</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-green-300 bg-clip-text text-transparent">
              registrada
            </span>
            <br />
            <span className="text-white">em 5 minutos</span>
          </h2>
          
          {/* Supporting text */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Não deixe suas criações desprotegidas. <strong className="text-white">Registre agora</strong> e 
            tenha a <strong className="text-primary">segurança jurídica</strong> que você precisa.
          </p>
          
          {/* Features highlight */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto my-12">
            {[
              { icon: Clock, text: "Certificado em 5 minutos" },
              { icon: Shield, text: "100% válido juridicamente" },
              { icon: Sparkles, text: "IA criativa incluída" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-green-400/30 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-gray-300 font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>
          
          {/* Main CTA button */}
          <div className="space-y-6">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="group relative px-12 py-6 text-xl font-bold bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 hover:scale-110"
            >
              Comece agora gratuitamente
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
              <span>✓ Sem cartão de crédito</span>
              <span>✓ Teste grátis por 7 dias</span>
              <span>✓ Suporte 24/7</span>
            </div>
          </div>
        </div>
        
        {/* Social proof */}
        <div className="mt-16 glass-card p-8 rounded-2xl border border-gray-800/50">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-gray-400">Compositores confiam</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-400">50K+</div>
              <div className="text-gray-400">Músicas registradas</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-gray-400">Uptime garantido</div>
            </div>
          </div>
        </div>
        
        {/* Final urgency message */}
        <div className="mt-12 p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl">
          <div className="flex items-center justify-center gap-3 text-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-gray-300">
              <strong className="text-red-400">Atenção:</strong> Cada segundo sem registro é um risco para seus direitos autorais
            </p>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};