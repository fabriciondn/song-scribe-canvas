
import React, { useState } from 'react';
import { Play, Pause, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';

interface MusicBase {
  id: string;
  title: string;
  audioUrl: string;
  genre: string;
}

// Mock data para demonstração
const mockBases: MusicBase[] = [
  { id: '1', title: 'Piseiro Básico 1', audioUrl: '/lovable-uploads/bases/piseiro1.mp3', genre: 'Piseiro' },
  { id: '2', title: 'Piseiro Melódico', audioUrl: '/lovable-uploads/bases/piseiro2.mp3', genre: 'Piseiro' },
  { id: '3', title: 'Trap 808', audioUrl: '/lovable-uploads/bases/trap1.mp3', genre: 'Trap' },
  { id: '4', title: 'Trap Melódico', audioUrl: '/lovable-uploads/bases/trap2.mp3', genre: 'Trap' },
  { id: '5', title: 'Sertanejo Universitário', audioUrl: '/lovable-uploads/bases/sertanejo1.mp3', genre: 'Sertanejo' },
  { id: '6', title: 'Sertanejo Raiz', audioUrl: '/lovable-uploads/bases/sertanejo2.mp3', genre: 'Sertanejo' },
  { id: '7', title: 'Gospel Adoração', audioUrl: '/lovable-uploads/bases/gospel1.mp3', genre: 'Gospel' },
  { id: '8', title: 'Gospel Celebração', audioUrl: '/lovable-uploads/bases/gospel2.mp3', genre: 'Gospel' },
  { id: '9', title: 'Funk Batidão', audioUrl: '/lovable-uploads/bases/funk1.mp3', genre: 'Funk' },
  { id: '10', title: 'Funk Melody', audioUrl: '/lovable-uploads/bases/funk2.mp3', genre: 'Funk' },
];

interface MusicBasesProps {
  onInsertBase: (baseInfo: { title: string; genre: string }) => void;
}

export const MusicBases: React.FC<MusicBasesProps> = ({ onInsertBase }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Agrupar as bases por gênero
  const basesByGenre = mockBases.reduce((acc, base) => {
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
        variant: "destructive",
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
        variant: "destructive",
      });
      setPlayingId(null);
    });
  };

  const handleInsert = (base: MusicBase) => {
    onInsertBase({ title: base.title, genre: base.genre });
    toast({
      title: "Base inserida",
      description: `A base "${base.title}" foi adicionada à sua composição.`,
    });
  };

  return (
    <div className="bg-card rounded-lg shadow-sm p-4 h-full">
      <h3 className="text-lg font-semibold mb-4">Bases Musicais</h3>
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(basesByGenre).map(([genre, bases]) => (
          <AccordionItem value={genre} key={genre}>
            <AccordionTrigger className="text-md font-medium">{genre}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-2">
                {bases.map((base) => (
                  <div key={base.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{base.title}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handlePlay(base)}
                        className="h-8 w-8"
                      >
                        {playingId === base.id ? <Pause size={16} /> : <Play size={16} />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleInsert(base)}
                      >
                        <Plus size={14} className="mr-1" /> Inserir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
