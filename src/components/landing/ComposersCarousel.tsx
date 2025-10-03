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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, artistic_name, avatar_url')
        .not('name', 'is', null)
        .limit(20);

      if (!error && data) {
        setComposers(data);
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
      <h3 className="text-center text-lg md:text-xl font-semibold mb-6">
        <span className="text-white">Compositores na </span>
        <span className="text-primary">Plataforma</span>
      </h3>
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-8">
          {composers.map((composer) => (
            <div 
              key={composer.id} 
              className="flex-[0_0_auto] flex flex-col items-center gap-3"
            >
              <Avatar className="h-24 w-24 border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:scale-105">
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
              <span className="text-sm text-gray-300 max-w-[100px] text-center truncate">
                {getDisplayName(composer)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
