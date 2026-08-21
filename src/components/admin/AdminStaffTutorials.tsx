import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  audience_type: 'staff';
}

const NetflixRow = ({ title, tutorials, onSelect }: { title: string, tutorials: Tutorial[], onSelect: (t: Tutorial) => void }) => {
  const [scrollX, setScrollX] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const { scrollLeft, clientWidth } = containerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      containerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (tutorials.length === 0) return null;

  return (
    <div className="space-y-4 mb-12 group/row relative">
      <h3 className="text-xl font-semibold text-white/90 px-2 flex items-center gap-2">
        <div className="w-1 h-6 bg-red-600 rounded-full" />
        {title}
      </h3>
      
      <div className="relative overflow-hidden">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:bg-black/80"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-2 py-4 snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tutorials.map((tutorial) => (
            <motion.div
              key={tutorial.id}
              whileHover={{ scale: 1.05, zIndex: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex-none w-72 aspect-video bg-[#181818] rounded-md overflow-hidden cursor-pointer shadow-lg border border-white/5 relative group/card snap-start"
              onClick={() => onSelect(tutorial)}
            >
              <img 
                src={tutorial.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop'} 
                alt={tutorial.title}
                className="w-full h-full object-cover opacity-80 group-hover/card:opacity-100 transition-opacity"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white hover:border-white transition-colors">
                    <Info className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="text-white font-bold text-sm leading-tight">{tutorial.title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] py-0 px-1 border-white/20 text-white/60">HD</Badge>
                  <span className="text-[10px] text-white/60">Onboarding</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white hover:bg-black/80"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export const AdminStaffTutorials: React.FC = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  useEffect(() => {
    fetchStaffTutorials();
  }, []);

  const fetchStaffTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('audience_type', 'staff')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error('Erro ao buscar tutoriais da equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(tutorials.map(t => t.category)));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white -mx-6 -mt-4 px-6 py-8">
      {/* Hero-like Banner for Staff */}
      <div className="relative h-[50vh] mb-12 rounded-xl overflow-hidden group/hero">
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-40 group-hover/hero:scale-105 transition-transform duration-1000"
          alt="Staff Onboarding"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent" />
        
        <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-12 max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <img src="/__l5e/assets-v1/3e3bdce3-f19c-4b1d-afe0-4fcac32b4eb2/logo-compuse.png" className="h-8" alt="Compuse" />
            <span className="text-red-600 font-bold tracking-[0.3em] text-xs uppercase">Staff Training</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none">
            CENTRAL DE<br /><span className="text-red-600">TREINAMENTO</span>
          </h1>
          <p className="text-lg text-white/60 leading-relaxed font-medium">
            Bem-vindo à área de tutoriais exclusiva da equipe Compuse. 
            Aqui você encontra todos os processos, manuais e guias para operar a plataforma com excelência.
          </p>
          
          <div className="flex items-center gap-4">
            <Button className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6 rounded-md font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
              <Play className="w-5 h-5 fill-current" />
              Começar Agora
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6 rounded-md font-bold flex items-center gap-2 backdrop-blur-md">
              <Info className="w-5 h-5" />
              Saiba Mais
            </Button>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="relative z-10 pb-20">
        {categories.length > 0 ? (
          categories.map(cat => (
            <NetflixRow 
              key={cat} 
              title={cat === 'getting-started' ? 'Primeiros Passos Equipe' : cat} 
              tutorials={tutorials.filter(t => t.category === cat)}
              onSelect={setSelectedTutorial}
            />
          ))
        ) : (
          <div className="text-center py-20 border border-white/5 bg-white/[0.02] rounded-2xl">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Nenhum tutorial encontrado</h3>
            <p className="text-white/40 max-w-md mx-auto">
              Adicione novos tutoriais para a equipe na aba "Tutoriais" principal para que apareçam aqui.
            </p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedTutorial(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#181818] rounded-xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedTutorial(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="aspect-video w-full bg-black">
                {selectedTutorial.video_url.includes('youtube.com') || selectedTutorial.video_url.includes('youtu.be') ? (
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${selectedTutorial.video_url.split('v=')[1] || selectedTutorial.video_url.split('/').pop()}`}
                    title={selectedTutorial.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video 
                    controls 
                    className="w-full h-full"
                    poster={selectedTutorial.thumbnail_url}
                  >
                    <source src={selectedTutorial.video_url} type="video/mp4" />
                  </video>
                )}
              </div>

              <div className="p-8 space-y-4 bg-gradient-to-b from-[#181818] to-[#121212]">
                <div className="flex items-center gap-4 text-emerald-400 font-bold text-sm">
                  <span>98% Relevante</span>
                  <span>2024</span>
                  <Badge className="bg-red-600">TREINAMENTO</Badge>
                  <div className="flex items-center gap-1 text-white/60 font-normal">
                    <Clock className="w-4 h-4" />
                    15 min
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold">{selectedTutorial.title}</h2>
                <p className="text-white/80 text-lg leading-relaxed max-w-3xl">
                  {selectedTutorial.description || "Este tutorial contém instruções detalhadas sobre os processos da equipe Compuse."}
                </p>
                
                <div className="pt-6 border-t border-white/10 flex items-center gap-12">
                  <div className="space-y-2">
                    <span className="text-white/40 text-sm">Elenco:</span>
                    <p className="text-sm">Equipe Compuse, Administração</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-white/40 text-sm">Gêneros:</span>
                    <p className="text-sm">Tutorial, Operacional, Administrativo</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};