import React, { useState, useEffect, useRef } from 'react';
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
import { Music, Upload, ChevronDown, ChevronUp, Play, Pause, Trash2, Check, Gauge } from 'lucide-react';
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

interface BasesSelectorProps {
  selectedBase: BaseMusical | null;
  onSelectBase: (base: BaseMusical | null) => void;
}

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
        {/* Botão de adicionar nova base */}
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

        {/* Player da base selecionada - compacto */}
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
            <audio
              ref={(el) => {
                selectedAudioRef.current = el;
                if (el) {
                  el.playbackRate = playbackRate;
                  el.onended = () => setIsPlayingSelected(false);
                  el.onplay = () => setIsPlayingSelected(true);
                  el.onpause = () => setIsPlayingSelected(false);
                }
              }}
              src={selectedBase.file_url}
              className="w-full h-8"
              controls
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
