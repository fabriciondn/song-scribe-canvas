import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { BaseMusical, getBases, getBasesByFolder } from '@/services/basesMusicais/basesService';
import { getFolders } from '@/services/folderService';

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
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Carregar pastas do banco de dados
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const foldersData = await getFolders();
        setFolders(foldersData);
      } catch (error) {
        console.error('Erro ao carregar pastas:', error);
      }
    };
    
    loadFolders();
  }, []);

  // Carregar bases do banco de dados
  useEffect(() => {
    const loadBases = async () => {
      try {
        setIsLoading(true);
        let basesData;
        
        if (selectedFolderId) {
          basesData = await getBasesByFolder(selectedFolderId);
        } else {
          basesData = await getBases();
        }
        
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
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBases();
  }, [selectedFolderId, toast]);

  // Update time tracking
  useEffect(() => {
    if (audioElement && playingId) {
      const updateTime = () => {
        setCurrentTime(audioElement.currentTime);
        setDuration(audioElement.duration || 0);
      };

      const interval = setInterval(updateTime, 100);
      audioElement.addEventListener('loadedmetadata', updateTime);
      audioElement.addEventListener('timeupdate', updateTime);

      return () => {
        clearInterval(interval);
        audioElement.removeEventListener('loadedmetadata', updateTime);
        audioElement.removeEventListener('timeupdate', updateTime);
      };
    }
  }, [audioElement, playingId]);
  
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
    audio.playbackRate = playbackRate;
    
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

  const handleSeek = (value: number[]) => {
    if (audioElement && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audioElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handlePlaybackRateChange = (value: number[]) => {
    const newRate = value[0];
    setPlaybackRate(newRate);
    if (audioElement) {
      audioElement.playbackRate = newRate;
    }
  };

  const skipTime = (seconds: number) => {
    if (audioElement) {
      const newTime = Math.max(0, Math.min(duration, audioElement.currentTime + seconds));
      audioElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setIsDialogOpen(false);
  };
  
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-sm text-foreground">Escolha sua base aqui!</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <Folder size={14} /> Gerenciar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Selecionar Pasta</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Button
                variant={selectedFolderId === null ? "default" : "ghost"}
                onClick={() => handleFolderSelect(null)}
                className="w-full justify-start"
              >
                <Folder size={16} className="mr-2" />
                Todas as bases
              </Button>
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={selectedFolderId === folder.id ? "default" : "ghost"}
                  onClick={() => handleFolderSelect(folder.id)}
                  className="w-full justify-start"
                >
                  <Folder size={16} className="mr-2" />
                  {folder.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          {Object.keys(basesByGenre).length === 0 ? (
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-2">
                {selectedFolderId ? "Nenhuma base encontrada nesta pasta." : "Nenhuma base musical encontrada."}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(basesByGenre).map(([genre, bases]) => (
                <AccordionItem value={genre} key={genre}>
                  <AccordionTrigger className="text-sm font-medium text-foreground">{genre}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col space-y-3">
                      {bases.map(base => (
                        <div key={base.id} className="p-3 bg-card border border-border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-foreground truncate">{base.title}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePlay(base)} 
                              className="h-8 w-8 p-0"
                            >
                              {playingId === base.id ? <Pause size={16} /> : <Play size={16} />}
                            </Button>
                          </div>
                          
                          {playingId === base.id && (
                            <div className="space-y-3 mt-3 pt-3 border-t border-border">
                              {/* Progress bar */}
                              <div className="space-y-1">
                                <Slider
                                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                                  onValueChange={handleSeek}
                                  className="w-full"
                                  max={100}
                                  step={0.1}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{formatTime(currentTime)}</span>
                                  <span>{formatTime(duration)}</span>
                                </div>
                              </div>
                              
                              {/* Controls */}
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => skipTime(-10)}
                                  className="h-8 w-8 p-0"
                                >
                                  <SkipBack size={14} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handlePlay(base)} 
                                  className="h-8 w-8 p-0"
                                >
                                  {playingId === base.id ? <Pause size={16} /> : <Play size={16} />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => skipTime(10)}
                                  className="h-8 w-8 p-0"
                                >
                                  <SkipForward size={14} />
                                </Button>
                              </div>
                              
                              {/* BPM Control */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">Velocidade</span>
                                  <span className="text-xs text-foreground">{playbackRate.toFixed(2)}x</span>
                                </div>
                                <Slider
                                  value={[playbackRate]}
                                  onValueChange={handlePlaybackRateChange}
                                  min={0.5}
                                  max={2.0}
                                  step={0.1}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}
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
    </div>
  );
};