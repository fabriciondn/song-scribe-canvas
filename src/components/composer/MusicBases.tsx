import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Folder, Plus, Repeat, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { getBases, getBasesByFolder } from '@/services/basesMusicais/basesService';
import { getFolders } from '@/services/folderService';
import { AudioMarkerSlider, Marker } from './AudioMarkerSlider';
import { nanoid } from 'nanoid';

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

// localStorage key for markers persistence
const MARKERS_STORAGE_KEY = 'audio_markers';

const getStoredMarkers = (baseId: string): Marker[] => {
  try {
    const stored = localStorage.getItem(MARKERS_STORAGE_KEY);
    if (stored) {
      const allMarkers = JSON.parse(stored);
      return allMarkers[baseId] || [];
    }
  } catch (e) {
    console.error('Error reading markers from localStorage:', e);
  }
  return [];
};

const saveMarkers = (baseId: string, markers: Marker[]) => {
  try {
    const stored = localStorage.getItem(MARKERS_STORAGE_KEY);
    const allMarkers = stored ? JSON.parse(stored) : {};
    allMarkers[baseId] = markers;
    localStorage.setItem(MARKERS_STORAGE_KEY, JSON.stringify(allMarkers));
  } catch (e) {
    console.error('Error saving markers to localStorage:', e);
  }
};

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
  
  // Marker and loop states
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isLoopActive, setIsLoopActive] = useState(false);
  
  const { toast } = useToast();

  // Load markers when base changes
  useEffect(() => {
    if (playingId) {
      const storedMarkers = getStoredMarkers(playingId);
      setMarkers(storedMarkers);
    } else {
      setMarkers([]);
    }
    // Reset loop when changing base
    setLoopStart(null);
    setLoopEnd(null);
    setIsLoopActive(false);
  }, [playingId]);

  // Loop logic
  useEffect(() => {
    if (audioElement && isLoopActive && loopStart !== null && loopEnd !== null) {
      const handleTimeUpdate = () => {
        if (audioElement.currentTime >= loopEnd) {
          audioElement.currentTime = loopStart;
        }
      };
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      return () => audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [audioElement, isLoopActive, loopStart, loopEnd]);

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
      // If loop is active, restart from loop start
      if (isLoopActive && loopStart !== null) {
        audio.currentTime = loopStart;
        audio.play();
      } else {
        setPlayingId(null);
      }
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

  const handleSeek = useCallback((time: number) => {
    if (audioElement && duration > 0) {
      audioElement.currentTime = time;
      setCurrentTime(time);
    }
  }, [audioElement, duration]);

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

  // Marker functions
  const handleAddMarker = useCallback((time: number) => {
    if (!playingId) return;
    
    const newMarker: Marker = {
      id: nanoid(8),
      time,
      color: '#FCD34D', // Amber/yellow
      label: `Marcador ${markers.length + 1}`
    };
    
    const updatedMarkers = [...markers, newMarker].sort((a, b) => a.time - b.time);
    setMarkers(updatedMarkers);
    saveMarkers(playingId, updatedMarkers);
    
    toast({
      title: "Marcador adicionado",
      description: `Marcador em ${formatTime(time)}`,
    });
  }, [playingId, markers, toast]);

  const handleAddMarkerAtCurrentTime = () => {
    handleAddMarker(currentTime);
  };

  const handleMarkerClick = useCallback((marker: Marker) => {
    handleSeek(marker.time);
  }, [handleSeek]);

  const handleMarkerRemove = useCallback((markerId: string) => {
    if (!playingId) return;
    
    const updatedMarkers = markers.filter(m => m.id !== markerId);
    setMarkers(updatedMarkers);
    saveMarkers(playingId, updatedMarkers);
    
    toast({
      title: "Marcador removido",
    });
  }, [playingId, markers, toast]);

  const handleClearAllMarkers = () => {
    if (!playingId) return;
    
    setMarkers([]);
    saveMarkers(playingId, []);
    setLoopStart(null);
    setLoopEnd(null);
    setIsLoopActive(false);
    
    toast({
      title: "Marcadores limpos",
      description: "Todos os marcadores foram removidos",
    });
  };

  const handleSetLoopStart = () => {
    setLoopStart(currentTime);
    toast({
      title: "Ponto A definido",
      description: `Início do loop: ${formatTime(currentTime)}`,
    });
  };

  const handleSetLoopEnd = () => {
    if (loopStart !== null && currentTime > loopStart) {
      setLoopEnd(currentTime);
      toast({
        title: "Ponto B definido",
        description: `Fim do loop: ${formatTime(currentTime)}`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Defina o ponto A primeiro e certifique-se que B vem depois",
        variant: "destructive"
      });
    }
  };

  const handleToggleLoop = () => {
    if (loopStart === null || loopEnd === null) {
      toast({
        title: "Configure o loop",
        description: "Defina os pontos A e B primeiro",
        variant: "destructive"
      });
      return;
    }
    setIsLoopActive(!isLoopActive);
    toast({
      title: isLoopActive ? "Loop desativado" : "Loop ativado",
      description: isLoopActive ? undefined : `Repetindo de ${formatTime(loopStart)} até ${formatTime(loopEnd)}`,
    });
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
              {Object.entries(basesByGenre).map(([genre, genreBases]) => (
                <AccordionItem value={genre} key={genre}>
                  <AccordionTrigger className="text-sm font-medium text-foreground">{genre}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col space-y-3">
                      {genreBases.map(base => (
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
                              {/* Progress bar with markers */}
                              <div className="space-y-1">
                                <AudioMarkerSlider
                                  value={currentTime}
                                  duration={duration}
                                  markers={markers}
                                  loopStart={loopStart}
                                  loopEnd={loopEnd}
                                  isLoopActive={isLoopActive}
                                  onSeek={handleSeek}
                                  onAddMarker={handleAddMarker}
                                  onMarkerClick={handleMarkerClick}
                                  onMarkerRemove={handleMarkerRemove}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{formatTime(currentTime)}</span>
                                  <span>{formatTime(duration)}</span>
                                </div>
                              </div>
                              
                              {/* Playback Controls */}
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

                              {/* Marker Controls */}
                              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-border">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleAddMarkerAtCurrentTime}
                                  className="h-7 text-xs gap-1 px-2"
                                  title="Adicionar marcador no tempo atual"
                                >
                                  <Plus size={12} /> Marcador
                                </Button>
                                <Button
                                  variant={loopStart !== null ? "default" : "outline"}
                                  size="sm"
                                  onClick={handleSetLoopStart}
                                  className="h-7 text-xs px-2 bg-green-500/20 hover:bg-green-500/30 border-green-500/50"
                                  title="Definir ponto A (início do loop)"
                                >
                                  A
                                </Button>
                                <Button
                                  variant={loopEnd !== null ? "default" : "outline"}
                                  size="sm"
                                  onClick={handleSetLoopEnd}
                                  className="h-7 text-xs px-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/50"
                                  title="Definir ponto B (fim do loop)"
                                >
                                  B
                                </Button>
                                <Button
                                  variant={isLoopActive ? "default" : "outline"}
                                  size="sm"
                                  onClick={handleToggleLoop}
                                  className={`h-7 text-xs gap-1 px-2 ${isLoopActive ? 'bg-primary' : ''}`}
                                  title="Ativar/desativar loop A-B"
                                >
                                  <Repeat size={12} /> Loop
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleClearAllMarkers}
                                  className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
                                  title="Limpar todos os marcadores"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>

                              {/* Markers list */}
                              {markers.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-2">
                                  {markers.map((marker, index) => (
                                    <button
                                      key={marker.id}
                                      onClick={() => handleMarkerClick(marker)}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-foreground transition-colors"
                                      title={`Ir para ${formatTime(marker.time)}`}
                                    >
                                      {index + 1}: {formatTime(marker.time)}
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              {/* BPM Control */}
                              <div className="space-y-2 pt-2 border-t border-border">
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
