
import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { BaseMusical, getBases } from '@/services/basesMusicais/basesService';

interface MusicBase {
  id: string;
  title: string;
  audioUrl: string;
  genre: string;
}

interface MusicBasesProps {
  onInsertBase: (baseInfo: {
    title: string;
    genre: string;
  }) => void;
}

export const MusicBases: React.FC<MusicBasesProps> = ({
  onInsertBase
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [bases, setBases] = useState<MusicBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Carregar bases do banco de dados
  useEffect(() => {
    const loadBases = async () => {
      try {
        setIsLoading(true);
        const basesData = await getBases();
        
        // Converter do formato da API para o formato usado pelo componente
        const formattedBases: MusicBase[] = basesData.map(base => ({
          id: base.id,
          title: base.name,
          audioUrl: base.file_url || '',
          genre: base.genre
        }));
        
        setBases(formattedBases);
      } catch (error) {
        console.error('Erro ao carregar bases musicais:', error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar as bases musicais.",
          variant: "destructive"
        });
        
        // Caso falhe, manter as bases padrão para demonstração
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBases();
  }, [toast]);
  
  // Agrupar as bases por gênero
  const basesByGenre = (bases || []).reduce((acc, base) => {
    if (!acc[base.genre]) {
      acc[base.genre] = [];
    }
    acc[base.genre].push(base);
    return acc;
  }, {} as Record<string, MusicBase[]>);
  
  const handlePlay = (base: MusicBase) => {
    if (audioElement) {
      audioElement.pause();
    }
    if (playingId === base.id) {
      setPlayingId(null);
      return;
    }
    const audio = new Audio(base.audioUrl);
    audio.onerror = () => {
      toast({
        title: "Erro ao reproduzir",
        description: "Base musical indisponível no momento.",
        variant: "destructive"
      });
      setPlayingId(null);
    };
    audio.onended = () => {
      setPlayingId(null);
    };
    setAudioElement(audio);
    setPlayingId(base.id);
    audio.play().catch(err => {
      console.error("Erro ao reproduzir áudio:", err);
      toast({
        title: "Erro ao reproduzir",
        description: "Não foi possível tocar esta base musical.",
        variant: "destructive"
      });
      setPlayingId(null);
    });
  };
  
  const handleInsert = (base: MusicBase) => {
    onInsertBase({
      title: base.title,
      genre: base.genre
    });
    toast({
      title: "Base inserida",
      description: `A base "${base.title}" foi adicionada à sua composição.`
    });
  };
  
  return <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-sm text-foreground">Escolha sua base aqui!</h3>
        <Link to="/bases">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            <Plus size={14} /> Gerenciar
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          {Object.keys(basesByGenre).length === 0 ? (
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-2">Nenhuma base musical encontrada.</p>
              <Link to="/bases">
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus size={14} /> Adicionar Base
                </Button>
              </Link>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(basesByGenre).map(([genre, bases]) => (
                <AccordionItem value={genre} key={genre}>
                  <AccordionTrigger className="text-sm font-medium text-foreground">{genre}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col space-y-2">
                      {bases.map(base => (
                        <div key={base.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-md">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{base.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePlay(base)} 
                              className="h-8 w-8 p-0"
                            >
                              {playingId === base.id ? <Pause size={16} /> : <Play size={16} />}
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="h-8 text-xs gap-1" 
                              onClick={() => handleInsert(base)}
                            >
                              <Plus size={14} /> Inserir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      )}
    </div>;
};
