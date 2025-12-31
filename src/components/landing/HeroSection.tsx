import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { ShaderBackground } from './ShaderBackground';
import { ComposersCarousel } from './ComposersCarousel';
interface HeroSectionProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}
export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onLearnMore
}) => {
  return <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-20">
      {/* Shader Background */}
      <ShaderBackground />
      
      {/* Overlay escuro para melhor contraste */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Conteúdo principal com max-width */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content - Lado Esquerdo */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="text-white">Proteja suas</span>{' '}
                <span className="bg-gradient-to-r from-primary to-green-300 bg-clip-text text-transparent">
                  músicas
                </span>{' '}
                <span className="text-white">em apenas 5 minutos</span>
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
              <Button onClick={onGetStarted} size="lg" className="group relative px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105">
                Começar agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button onClick={onLearnMore} variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold border-gray-600 text-gray-300 hover:border-primary hover:text-white hover:bg-primary/10 transition-all duration-300">
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

          {/* Video Player - Lado Direito */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none z-10" />
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/tKQ7kZjvjqI?controls=1&modestbranding=1&rel=0"
                title="Apresentação Compuse"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Composers Carousel - Full width, fora do container */}
      <div className="relative z-10 w-full mt-12">
        <ComposersCarousel />
      </div>
    </section>;
};