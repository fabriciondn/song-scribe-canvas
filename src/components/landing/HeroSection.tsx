import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onLearnMore }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-green-950/20 to-black" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-white">Proteja suas</span>{' '}
              <span className="bg-gradient-to-r from-primary to-green-300 bg-clip-text text-transparent">
                músicas
              </span>{' '}
              <span className="text-white">com segurança</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
              <strong className="text-primary">Rapidez</strong> e{' '}
              <strong className="text-primary">validade jurídica</strong> no registro autoral
            </p>
          </div>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
            Compuse é a plataforma mais completa do Brasil para compositores: IA criativa, 
            rascunhos com áudio e <strong className="text-white">registro autoral com certificado 
            emitido em até 5 minutos</strong>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="group relative px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={onLearnMore}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold border-gray-600 text-gray-300 hover:border-primary hover:text-white hover:bg-primary/10 transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Saiba mais
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Certificado em 5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-500" />
              <span>Validade jurídica garantida</span>
            </div>
          </div>
        </div>
        
        {/* Visual mockup */}
        <div className="relative">
          <div className="glass-card p-8 rounded-2xl shadow-2xl shadow-primary/20 border border-gray-800/50">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              
              <div className="space-y-3">
                <div className="h-4 bg-gradient-to-r from-primary/50 to-green-400/50 rounded animate-pulse" />
                <div className="h-3 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
                <div className="mt-6 h-8 bg-gradient-to-r from-primary to-green-400 rounded animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-6 -right-6 glass-card p-4 rounded-xl shadow-lg border border-primary/20">
            <div className="flex items-center gap-2 text-sm text-primary font-semibold">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Registrando...
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};