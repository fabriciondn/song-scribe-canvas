import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircle, Music, Shield, Clock, CheckCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { trackPageView, trackVideoPlay, trackVideoProgress, trackVideoComplete, trackButtonClick } from '@/services/offerAnalyticsService';

console.log('[Oferta] Componente carregado - versao 2026.01.29');

const Oferta: React.FC = () => {
  const navigate = useNavigate();
  const videoProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const watchTimeRef = useRef(0);
  const hasTrackedPlay = useRef(false);
  const pixelInjected = useRef(false);

  // Fetch and inject Meta Pixel code
  const { data: pixelCode } = useQuery({
    queryKey: ['offer-page-pixel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_page_settings')
        .select('setting_value')
        .eq('setting_key', 'meta_pixel_code')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.setting_value || '';
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Inject Meta Pixel into head
  useEffect(() => {
    if (pixelCode && !pixelInjected.current) {
      // Create a container for the pixel code
      const pixelContainer = document.createElement('div');
      pixelContainer.id = 'meta-pixel-container';
      pixelContainer.innerHTML = pixelCode;
      
      // Extract and execute script tags
      const scripts = pixelContainer.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        document.head.appendChild(newScript);
      });
      
      // Also add noscript tags
      const noscripts = pixelContainer.querySelectorAll('noscript');
      noscripts.forEach((noscript) => {
        const newNoscript = document.createElement('noscript');
        newNoscript.innerHTML = noscript.innerHTML;
        document.head.appendChild(newNoscript);
      });
      
      pixelInjected.current = true;
      console.log('Meta Pixel injected successfully');
    }
  }, [pixelCode]);

  // Force dark theme and enable scroll
  useEffect(() => {
    console.log('[Oferta] useEffect principal executando - iniciando tracking');
    document.documentElement.classList.add('dark');
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    
    // Track page view
    console.log('[Oferta] Chamando trackPageView...');
    trackPageView();
    console.log('[Oferta] trackPageView chamado com sucesso');
    
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
      
      // Clear interval on unmount
      if (videoProgressInterval.current) {
        clearInterval(videoProgressInterval.current);
      }
    };
  }, []);

  // Duração do vídeo em segundos (aproximadamente 3 minutos)
  const videoDuration = 180;
  const hasTrackedComplete = useRef(false);

  // Start tracking video progress when component mounts (video autoplays)
  useEffect(() => {
    // Video starts automatically, so we track play after a short delay
    const playTimer = setTimeout(() => {
      if (!hasTrackedPlay.current) {
        trackVideoPlay();
        hasTrackedPlay.current = true;
        
        // Start tracking progress every 30 seconds
        videoProgressInterval.current = setInterval(() => {
          watchTimeRef.current += 30;
          const percentComplete = Math.min((watchTimeRef.current / videoDuration) * 100, 100);
          trackVideoProgress(watchTimeRef.current, percentComplete);
          
          // Registrar conclusão quando atingir 90% ou mais
          if (percentComplete >= 90 && !hasTrackedComplete.current) {
            trackVideoComplete();
            hasTrackedComplete.current = true;
          }
        }, 30000);
      }
    }, 2000);

    return () => {
      clearTimeout(playTimer);
      if (videoProgressInterval.current) {
        clearInterval(videoProgressInterval.current);
      }
    };
  }, []);

  // Fetch composers for testimonials
  const { data: composers } = useQuery({
    queryKey: ['composers-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, artistic_name, avatar_url')
        .not('avatar_url', 'is', null)
        .not('name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleRegisterClick = async () => {
    console.log('[Oferta] Clique no botão REGISTRAR');
    // Track primeiro, depois navega
    await trackButtonClick('register');
    navigate('/?action=register');
  };

  const handleWhatsAppClick = async () => {
    console.log('[Oferta] Clique no botão WHATSAPP');
    // Track primeiro com await para garantir registro
    await trackButtonClick('whatsapp');
    // Depois abre o WhatsApp
    window.open('https://wa.me/5519995081355?text=Ol%C3%A1%2C%20vim%20pela%20oferta%20de%20R%2419%2C99%20e%20quero%20registrar%20minha%20m%C3%BAsica!', '_blank');
  };

  const testimonialQuotes = [
    "Registrei minha primeira música em menos de 10 minutos. Incrível!",
    "O suporte pelo WhatsApp é muito rápido, me ajudaram em tudo.",
    "Finalmente uma plataforma que protege o compositor de verdade.",
    "Já registrei mais de 20 músicas aqui. Recomendo demais!",
    "O certificado chega rapidinho e tem validade jurídica real.",
    "Melhor investimento que fiz na minha carreira como compositor."
  ];

  const faqItems = [
    {
      question: "O registro tem validade jurídica?",
      answer: "Sim! Nosso registro segue a Lei de Direitos Autorais (Lei 9.610/98) e gera um certificado com hash criptográfico que comprova a autoria e a data de criação da sua obra."
    },
    {
      question: "Quanto tempo demora para receber o certificado?",
      answer: "O certificado é gerado automaticamente em até 5 minutos após a conclusão do registro. Você recebe tudo por e-mail e pode acessar pelo painel a qualquer momento."
    },
    {
      question: "Posso registrar letra e melodia juntas?",
      answer: "Sim! Você pode enviar a letra escrita e também um áudio com a melodia. Ambos ficam protegidos no mesmo registro."
    },
    {
      question: "Preciso de CNPJ ou ser profissional da música?",
      answer: "Não! Qualquer pessoa física pode registrar suas composições. Basta ter CPF válido e ser maior de 18 anos (ou ter autorização dos responsáveis)."
    },
    {
      question: "E se alguém copiar minha música depois do registro?",
      answer: "Com o certificado Compuse, você tem uma prova de anterioridade com data e hora. Isso pode ser usado em processos judiciais para comprovar que você é o autor original."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header simples */}
      <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-center">
          <img 
            src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
            alt="Compuse Logo" 
            className="h-8"
          />
        </div>
      </header>

      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 text-center">
          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="text-white">Sua música protegida por apenas</span>{' '}
            <span className="bg-gradient-to-r from-primary to-green-300 bg-clip-text text-transparent">
              R$19,99
            </span>
          </h1>
          
          <p className="text-sm text-gray-400 mb-6 flex items-center justify-center gap-2">
            🔊 Ative o som e aumente o volume para uma melhor experiência
          </p>

          {/* Video */}
          <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/30 mb-8">
            <iframe
              src="https://player.vimeo.com/video/1159784001?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1"
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              title="Apresentação Compuse - Oferta Especial"
              loading="lazy"
              allowFullScreen
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              onClick={handleRegisterClick}
              size="lg"
              className="group px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
              <Music className="mr-2 h-5 w-5" />
              Registrar música agora
            </Button>
            
            <Button 
              onClick={handleWhatsAppClick}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Registrar pelo WhatsApp
            </Button>
          </div>

          {/* Promo Copy */}
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-gray-950 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-primary font-semibold">Oferta por tempo limitado</span>
              </div>
              <p className="text-lg text-gray-300 mb-4">
                Nosso registro de{' '}
                <span className="line-through text-gray-500">R$30,00</span>{' '}
                por apenas{' '}
                <span className="text-2xl font-bold text-primary">R$19,99</span>{' '}
                cada música
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Suporte total via WhatsApp</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-green-400" />
                  <span>Certificado em 5 min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            O que nossos compositores dizem
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {composers?.slice(0, 6).map((composer, index) => (
              <Card key={composer.id} className="bg-gray-900/50 border-gray-800 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {composer.avatar_url ? (
                      <img 
                        src={composer.avatar_url} 
                        alt={composer.artistic_name || composer.name || 'Compositor'}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center">
                        <Music className="h-6 w-6 text-black" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {composer.artistic_name || composer.name || 'Compositor'}
                      </p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm italic">
                    "{testimonialQuotes[index % testimonialQuotes.length]}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fallback if no composers */}
          {(!composers || composers.length === 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonialQuotes.slice(0, 3).map((quote, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center">
                        <Music className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Compositor Compuse</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">"{quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-6 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Dúvidas frequentes
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gray-900/50 border border-gray-800 rounded-lg px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left text-white hover:text-primary py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para proteger sua música?
          </h2>
          <p className="text-gray-400 mb-8">
            Não deixe sua obra desprotegida. Registre agora por apenas R$19,99.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleRegisterClick}
              size="lg"
              className="group px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-green-400 hover:from-green-400 hover:to-primary text-black shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
              <Music className="mr-2 h-5 w-5" />
              Registrar música agora
            </Button>
            
            <Button 
              onClick={handleWhatsAppClick}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Falar no WhatsApp
            </Button>
          </div>
        </section>
      </main>

      {/* Footer simples */}
      <footer className="py-8 px-6 bg-gray-950 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <img 
            src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
            alt="Compuse Logo" 
            className="h-6 mx-auto mb-4"
          />
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Compuse. Protegendo compositores com tecnologia e respaldo jurídico.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Oferta;
