import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
interface Composer {
  id: string;
  name: string;
  artistic_name: string | null;
  avatar_url: string | null;
}
export const ComposersCarousel: React.FC = () => {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [emblaRef] = useEmblaCarousel({
    loop: true,
    dragFree: true,
    align: 'start'
  }, [AutoScroll({
    playOnInit: true,
    speed: isMobile ? 0.3 : 0.5, // Velocidade reduzida no mobile
    stopOnInteraction: false
  })]);
  useEffect(() => {
    const fetchComposers = async () => {
      // Buscar TODOS os perfis públicos (sem limite)
      const {
        data: allProfiles,
        error
      } = await supabase
        .from('profiles')
        .select('id, name, artistic_name, avatar_url')
        .not('name', 'is', null)
        .order('created_at', { ascending: false });
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

  // Duplicar compositores 2x no mobile (menos elementos) ou 3x no desktop
  const infiniteComposers = isMobile 
    ? [...composers.slice(0, 20), ...composers.slice(0, 20)] // Limitar a 40 elementos no mobile
    : [...composers, ...composers, ...composers];
  
  return <div className="w-full" style={{ touchAction: 'pan-y' }}>
      <h3 className="text-xl md:text-2xl font-bold text-center mb-6">
        Compositores na{' '}
        <span className="text-primary">Compuse</span>
      </h3>
      
      <div className="w-full overflow-hidden" ref={emblaRef} style={{ touchAction: 'pan-x' }}>
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