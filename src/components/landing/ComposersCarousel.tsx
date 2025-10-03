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
  const [emblaRef] = useEmblaCarousel(
    { 
      loop: true, 
      dragFree: true,
      align: 'start',
    },
    [AutoScroll({ playOnInit: true, speed: 1, stopOnInteraction: false })]
  );

  useEffect(() => {
    const fetchComposers = async () => {
      // Buscar perfis públicos com avatar
      const { data: profilesWithAvatar, error: error1 } = await supabase
        .from('profiles')
        .select('id, name, artistic_name, avatar_url')
        .not('name', 'is', null)
        .not('avatar_url', 'is', null)
        .limit(10);

      // Buscar perfis públicos sem avatar para completar
      const { data: profilesWithoutAvatar, error: error2 } = await supabase
        .from('profiles')
        .select('id, name, artistic_name, avatar_url')
        .not('name', 'is', null)
        .is('avatar_url', null)
        .limit(10);

      const allProfiles = [
        ...(profilesWithAvatar || []),
        ...(profilesWithoutAvatar || [])
      ];

      if (allProfiles.length > 0) {
        setComposers(allProfiles);
      } else {
        // Compositores de exemplo se não houver dados
        setComposers([
          { id: '1', name: 'Beatriz Alves', artistic_name: null, avatar_url: null },
          { id: '2', name: 'Lucas Ferreira', artistic_name: null, avatar_url: null },
          { id: '3', name: 'Camila Rocha', artistic_name: null, avatar_url: null },
          { id: '4', name: 'Bruno Martins', artistic_name: null, avatar_url: null },
          { id: '5', name: 'Fernanda Cruz', artistic_name: null, avatar_url: null },
          { id: '6', name: 'Diego Pereira', artistic_name: null, avatar_url: null },
        ]);
      }
    };

    fetchComposers();
  }, []);

  const getDisplayName = (composer: Composer) => {
    return composer.artistic_name || composer.name || 'Compositor';
  };

  const getInitials = (composer: Composer) => {
    const name = getDisplayName(composer);
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (composers.length === 0) return null;

  return (
    <div className="w-full mt-12">
      <h3 className="text-center text-lg md:text-xl font-semibold mb-8">
        <span className="text-white">Compositores na </span>
        <span className="text-primary">Plataforma</span>
      </h3>
      
      <div className="flex justify-center items-center">
        <div className="overflow-hidden max-w-5xl" ref={emblaRef}>
          <div className="flex gap-12 justify-center">
            {composers.map((composer) => (
              <div 
                key={composer.id} 
                className="flex-[0_0_auto] flex flex-col items-center gap-3"
              >
                <Avatar className="h-28 w-28 md:h-32 md:w-32 border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:scale-105">
                  {composer.avatar_url ? (
                    <AvatarImage 
                      src={composer.avatar_url} 
                      alt={getDisplayName(composer)}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {getInitials(composer)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-300 max-w-[120px] text-center truncate">
                  {getDisplayName(composer)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
