import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Music, Upload, ChevronDown, ChevronUp, Play, Pause, Trash2, Check, Gauge, Plus, Repeat } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  BaseMusical,
  BaseMusicalInput,
  getBases,
  createBaseMusical,
  removeBaseMusical,
  ensureMusicBasesBucketExists,
} from '@/services/basesMusicais/basesService';
import { AudioMarkerSlider, Marker } from '@/components/composer/AudioMarkerSlider';
import { nanoid } from 'nanoid';

interface BasesSelectorProps {
  selectedBase: BaseMusical | null;
  onSelectBase: (base: BaseMusical | null) => void;
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
export const BasesSelector: React.FC<BasesSelectorProps> = ({
  selectedBase,
  onSelectBase,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bases, setBases] = useState<BaseMusical[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingBase, setIsAddingBase] = useState(false);
  const [playingBaseId, setPlayingBaseId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlayingSelected, setIsPlayingSelected] = useState(false);
  const selectedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedAudioEl, setSelectedAudioEl] = useState<HTMLAudioElement | null>(null);

  // Selected base markers + loop
  const [selectedCurrentTime, setSelectedCurrentTime] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [selectedMarkers, setSelectedMarkers] = useState<Marker[]>([]);
  const [selectedLoopStart, setSelectedLoopStart] = useState<number | null>(null);
  const [selectedLoopEnd, setSelectedLoopEnd] = useState<number | null>(null);
  const [isSelectedLoopActive, setIsSelectedLoopActive] = useState(false);

  const [newBase, setNewBase] = useState({
    name: '',
    genre: '',
    file: null as File | null,
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadBases();
    }
  }, [user]);

  // Load markers when selected base changes
  useEffect(() => {
    if (selectedBase?.id) {
      setSelectedMarkers(getStoredMarkers(selectedBase.id));
    } else {
      setSelectedMarkers([]);
    }
    setSelectedLoopStart(null);
    setSelectedLoopEnd(null);
    setIsSelectedLoopActive(false);
    setSelectedCurrentTime(0);
    setSelectedDuration(0);
  }, [selectedBase?.id]);

  // Track time/duration for selected base audio
  useEffect(() => {
    if (!selectedAudioEl) return;

    const update = () => {
      setSelectedCurrentTime(selectedAudioEl.currentTime || 0);
      setSelectedDuration(selectedAudioEl.duration || 0);
    };

    selectedAudioEl.addEventListener('loadedmetadata', update);
    selectedAudioEl.addEventListener('timeupdate', update);

    return () => {
      selectedAudioEl.removeEventListener('loadedmetadata', update);
      selectedAudioEl.removeEventListener('timeupdate', update);
    };
  }, [selectedAudioEl]);

  // Loop logic for selected base
  useEffect(() => {
    if (!selectedAudioEl || !isSelectedLoopActive || selectedLoopStart === null || selectedLoopEnd === null) return;

    const handle = () => {
      if (selectedAudioEl.currentTime >= selectedLoopEnd) {
        selectedAudioEl.currentTime = selectedLoopStart;
      }
    };

    selectedAudioEl.addEventListener('timeupdate', handle);
    return () => selectedAudioEl.removeEventListener('timeupdate', handle);
  }, [selectedAudioEl, isSelectedLoopActive, selectedLoopStart, selectedLoopEnd]);

  const loadBases = async () => {
    try {
      setIsLoading(true);
      await ensureMusicBasesBucketExists();
      const basesData = await getBases();
      setBases(basesData);
    } catch (error) {
      console.error('Erro ao carregar bases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBase = async () => {
    if (!newBase.name.trim() || !newBase.genre.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome e gênero são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (!newBase.file) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo de áudio',
        variant: 'destructive',
      });
      return;
    }

    // Verificar tamanho do arquivo (máximo de 10MB)
    const fileSizeMB = newBase.file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 10MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      const baseInput: BaseMusicalInput = {
        name: newBase.name,
        genre: newBase.genre,
        description: '',
        file: newBase.file,
      };

      const createdBase = await createBaseMusical(baseInput);
      
      if (createdBase) {
        setBases(prev => [createdBase, ...prev]);
        setNewBase({ name: '', genre: '', file: null });
        setIsAddingBase(false);
        toast({
          title: 'Base adicionada',
          description: `A base "${newBase.name}" foi adicionada com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Erro ao criar base:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível adicionar a base musical.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBase = async (base: BaseMusical) => {
    try {
      setIsLoading(true);
      const success = await removeBaseMusical(base.id);
      
      if (success) {
        setBases(prev => prev.filter(b => b.id !== base.id));
        if (selectedBase?.id === base.id) {
          onSelectBase(null);
        }
        toast({
          title: 'Base removida',
          description: `A base "${base.name}" foi removida.`,
        });
      }
    } catch (error) {
      console.error('Erro ao remover base:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover a base musical.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = (base: BaseMusical) => {
    if (playingBaseId === base.id) {
      audioRef?.pause();
      setPlayingBaseId(null);
    } else {
      if (audioRef) {
        audioRef.pause();
      }
      const audio = new Audio(base.file_url);
      audio.play();
      audio.onended = () => setPlayingBaseId(null);
      setAudioRef(audio);
      setPlayingBaseId(base.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewBase(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex justify-between items-center p-4 h-auto"
        >
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-medium">Minhas Bases</span>
            {selectedBase && (
              <span className="text-sm text-muted-foreground ml-2">
                ({selectedBase.name})
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="p-4 pt-0 space-y-4">
        {/* Botão de adicionar nova base - só mostra se não tem base selecionada */}
        {!selectedBase && (
          <Dialog open={isAddingBase} onOpenChange={setIsAddingBase}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Enviar Nova Base
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Base Musical</DialogTitle>
                <DialogDescription>
                  Faça upload de uma base musical para usar em suas composições.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="base-name">Nome da Base</Label>
                  <Input
                    id="base-name"
                    value={newBase.name}
                    onChange={(e) => setNewBase(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Forró Pé de Serra 120 BPM"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="base-genre">Gênero</Label>
                  <Input
                    id="base-genre"
                    value={newBase.genre}
                    onChange={(e) => setNewBase(prev => ({ ...prev, genre: e.target.value }))}
                    placeholder="Ex: Forró"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="base-file">Arquivo de Áudio</Label>
                  <Input
                    id="base-file"
                    type="file"
                    accept=".mp3,audio/*"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground">Formatos aceitos: MP3, WAV. Máximo: 10MB</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingBase(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddBase} disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Lista de bases */}
        {isLoading && bases.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Carregando bases...
          </div>
        ) : bases.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Você ainda não possui bases musicais.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bases
              .filter((base) => selectedBase?.id !== base.id)
              .map((base) => (
              <div
                key={base.id}
                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => onSelectBase(base)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(base);
                    }}
                  >
                    {playingBaseId === base.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <p className="text-sm font-medium">{base.name}</p>
                    <p className="text-xs text-muted-foreground">{base.genre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBase(base);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player da base selecionada - compacto (com marcadores e loop A-B) */}
        {selectedBase && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium">{selectedBase.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Vel:</span>
                <div className="flex gap-1">
                  {[0.75, 1, 1.25, 1.5].map((rate) => (
                    <Button
                      key={rate}
                      variant={playbackRate === rate ? "default" : "ghost"}
                      size="sm"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={() => {
                        setPlaybackRate(rate);
                        if (selectedAudioRef.current) {
                          selectedAudioRef.current.playbackRate = rate;
                        }
                      }}
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hidden audio element (we provide custom controls) */}
            <audio
              ref={(el) => {
                selectedAudioRef.current = el;
                setSelectedAudioEl(el);
                if (el) {
                  el.playbackRate = playbackRate;
                  el.onended = () => {
                    if (isSelectedLoopActive && selectedLoopStart !== null) {
                      el.currentTime = selectedLoopStart;
                      el.play();
                    } else {
                      setIsPlayingSelected(false);
                    }
                  };
                  el.onplay = () => setIsPlayingSelected(true);
                  el.onpause = () => setIsPlayingSelected(false);
                }
              }}
              src={selectedBase.file_url}
              preload="metadata"
            />

            {/* Timeline with markers */}
            <div className="space-y-1">
              <AudioMarkerSlider
                value={selectedCurrentTime}
                duration={selectedDuration}
                markers={selectedMarkers}
                loopStart={selectedLoopStart}
                loopEnd={selectedLoopEnd}
                isLoopActive={isSelectedLoopActive}
                onSeek={(time) => {
                  if (selectedAudioRef.current) {
                    selectedAudioRef.current.currentTime = time;
                  }
                }}
                onAddMarker={(time) => {
                  if (!selectedBase?.id) return;
                  const newMarker: Marker = {
                    id: nanoid(8),
                    time,
                    color: 'hsl(var(--accent))',
                    label: `Marcador ${selectedMarkers.length + 1}`,
                  };
                  const updated = [...selectedMarkers, newMarker].sort((a, b) => a.time - b.time);
                  setSelectedMarkers(updated);
                  saveMarkers(selectedBase.id, updated);
                  toast({
                    title: 'Marcador adicionado',
                    description: `Marcador em ${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, '0')}`,
                  });
                }}
                onMarkerClick={(marker) => {
                  if (selectedAudioRef.current) {
                    selectedAudioRef.current.currentTime = marker.time;
                  }
                }}
                onMarkerRemove={(markerId) => {
                  if (!selectedBase?.id) return;
                  const updated = selectedMarkers.filter(m => m.id !== markerId);
                  setSelectedMarkers(updated);
                  saveMarkers(selectedBase.id, updated);
                }}
                showHints={false}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {Math.floor(selectedCurrentTime / 60)}:{Math.floor(selectedCurrentTime % 60).toString().padStart(2, '0')}
                </span>
                <span>
                  {Math.floor(selectedDuration / 60)}:{Math.floor(selectedDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const el = selectedAudioRef.current;
                  if (!el) return;
                  if (el.paused) {
                    el.play();
                  } else {
                    el.pause();
                  }
                }}
                title={isPlayingSelected ? 'Pausar' : 'Reproduzir'}
              >
                {isPlayingSelected ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 px-2"
                  onClick={() => {
                    if (!selectedBase?.id) return;
                    const time = selectedCurrentTime;
                    const newMarker: Marker = {
                      id: nanoid(8),
                      time,
                      color: 'hsl(var(--accent))',
                      label: `Marcador ${selectedMarkers.length + 1}`,
                    };
                    const updated = [...selectedMarkers, newMarker].sort((a, b) => a.time - b.time);
                    setSelectedMarkers(updated);
                    saveMarkers(selectedBase.id, updated);
                  }}
                  title="Adicionar marcador no tempo atual"
                >
                  <Plus size={12} /> Marcador
                </Button>

                <Button
                  variant={selectedLoopStart !== null ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-2 bg-primary/10 hover:bg-primary/20 border-primary/30"
                  onClick={() => {
                    setSelectedLoopStart(selectedCurrentTime);
                  }}
                  title="Definir ponto A (início do loop)"
                >
                  A
                </Button>

                <Button
                  variant={selectedLoopEnd !== null ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-2 bg-destructive/10 hover:bg-destructive/20 border-destructive/30"
                  onClick={() => {
                    if (selectedLoopStart !== null && selectedCurrentTime > selectedLoopStart) {
                      setSelectedLoopEnd(selectedCurrentTime);
                    } else {
                      toast({
                        title: 'Erro',
                        description: 'Defina o ponto A primeiro e certifique-se que B vem depois',
                        variant: 'destructive',
                      });
                    }
                  }}
                  title="Definir ponto B (fim do loop)"
                >
                  B
                </Button>

                <Button
                  variant={isSelectedLoopActive ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1 px-2"
                  onClick={() => {
                    if (selectedLoopStart === null || selectedLoopEnd === null) {
                      toast({
                        title: 'Configure o loop',
                        description: 'Defina os pontos A e B primeiro',
                        variant: 'destructive',
                      });
                      return;
                    }
                    setIsSelectedLoopActive(!isSelectedLoopActive);
                  }}
                  title="Ativar/desativar loop A-B"
                >
                  <Repeat size={12} /> Loop
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (!selectedBase?.id) return;
                    setSelectedMarkers([]);
                    saveMarkers(selectedBase.id, []);
                    setSelectedLoopStart(null);
                    setSelectedLoopEnd(null);
                    setIsSelectedLoopActive(false);
                  }}
                  title="Limpar marcadores e loop"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
