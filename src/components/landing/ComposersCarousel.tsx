import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';

// Detectar se é iOS PWA (standalone mode) - desativar AutoScroll para evitar travamento
const isIOSPWA = () => {
  if (typeof window === 'undefined') return false;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  return isIOS && isStandalone;
};

interface Composer {
  id: string;
  name: string;
  artistic_name: string | null;
  avatar_url: string | null;
}
export const ComposersCarousel: React.FC = () => {
  const [composers, setComposers] = useState<Composer[]>([]);
  
  // No iOS PWA, desativar AutoScroll para evitar travamento na transição
  const plugins = useMemo(() => {
    if (isIOSPWA()) {
      return []; // Sem AutoScroll no iOS PWA
    }
    return [AutoScroll({
      playOnInit: true,
      speed: 0.5,
      stopOnInteraction: false
    })];
  }, []);
  
  const [emblaRef] = useEmblaCarousel({
    loop: true,
    dragFree: true,
    align: 'start'
  }, plugins);
  useEffect(() => {
    const fetchComposers = async () => {
      // Buscar apenas os 50 últimos perfis para performance
      const {
        data: allProfiles,
        error
      } = await supabase
        .from('profiles')
        .select('id, name, artistic_name, avatar_url')
        .not('name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Erro ao buscar compositores:', error);
      }
      
      if (allProfiles && allProfiles.length > 0) {
        setComposers(allProfiles);
      } else {
        // Compositores de exemplo se não houver dados
        setComposers([{
          id: '1',
          name: 'Beatriz Alves',
          artistic_name: null,
          avatar_url: null
        }, {
          id: '2',
          name: 'Lucas Ferreira',
          artistic_name: null,
          avatar_url: null
        }, {
          id: '3',
          name: 'Camila Rocha',
          artistic_name: null,
          avatar_url: null
        }, {
          id: '4',
          name: 'Bruno Martins',
          artistic_name: null,
          avatar_url: null
        }, {
          id: '5',
          name: 'Fernanda Cruz',
          artistic_name: null,
          avatar_url: null
        }, {
          id: '6',
          name: 'Diego Pereira',
          artistic_name: null,
          avatar_url: null
        }]);
      }
    };
    fetchComposers();
  }, []);
  const getDisplayName = (composer: Composer) => {
    return composer.artistic_name || composer.name || 'Compositor';
  };
  const getInitials = (composer: Composer) => {
    const name = getDisplayName(composer);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  if (composers.length === 0) return null;

  // Detectar mobile para reduzir duplicação e consumo de memória
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Duplicar 2x em mobile, 3x em desktop para efeito infinito
  const infiniteComposers = isMobile 
    ? [...composers, ...composers] 
    : [...composers, ...composers, ...composers];
    
  return <div className="w-full">
      <h3 className="text-xl md:text-2xl font-bold text-center mb-6">
        Compositores na{' '}
        <span className="text-primary">Compuse</span>
      </h3>
      
      <div className="w-full overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {infiniteComposers.map((composer, index) => <div key={`${composer.id}-${index}`} className="flex-shrink-0 flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/20">
                <AvatarImage src={composer.avatar_url || undefined} alt={getDisplayName(composer)} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {getInitials(composer)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-300 text-center max-w-[120px] truncate">
                {getDisplayName(composer)}
              </span>
            </div>)}
        </div>
      </div>
    </div>;
};