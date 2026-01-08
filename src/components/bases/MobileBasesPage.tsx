import React, { useState, useRef } from 'react';
import { ChevronLeft, Upload, Save, Play, Pause, CheckCircle, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { BaseMusical, BaseMusicalInput, createBaseMusical } from '@/services/basesMusicais/basesService';

interface MobileBasesPageProps {
  bases: BaseMusical[];
  isLoading: boolean;
  onBaseCreated: (base: BaseMusical) => void;
}

const GENRES = [
  { value: 'pop', label: 'Pop' },
  { value: 'funk', label: 'Funk' },
  { value: 'trap', label: 'Trap' },
  { value: 'samba', label: 'Samba' },
  { value: 'lofi', label: 'Lo-Fi' },
  { value: 'rock', label: 'Rock' },
  { value: 'sertanejo', label: 'Sertanejo' },
  { value: 'pagode', label: 'Pagode' },
  { value: 'forro', label: 'Forró' },
  { value: 'mpb', label: 'MPB' },
  { value: 'acoustic', label: 'Acústico' },
  { value: 'edm', label: 'EDM' },
];

export const MobileBasesPage: React.FC<MobileBasesPageProps> = ({ 
  bases, 
  isLoading,
  onBaseCreated 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo de áudio (.mp3 ou .wav)",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSaveBase = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Informe o título da base musical",
        variant: "destructive"
      });
      return;
    }
    if (!genre) {
      toast({
        title: "Gênero obrigatório",
        description: "Selecione o gênero da base musical",
        variant: "destructive"
      });
      return;
    }
    if (!selectedFile) {
      toast({
        title: "Áudio obrigatório",
        description: "Adicione um arquivo de áudio",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const baseInput: BaseMusicalInput = {
        name: title,
        genre: genre,
        description: '',
        file: selectedFile
      };
      
      const newBase = await createBaseMusical(baseInput);
      
      if (newBase) {
        onBaseCreated(newBase);
        setTitle('');
        setGenre('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast({
          title: "Base salva!",
          description: `"${title}" foi adicionada às suas bases`
        });
      }
    } catch (error) {
      console.error('Erro ao salvar base:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a base musical",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlay = (baseId: string, fileUrl: string) => {
    if (playingId === baseId) {
      audioRefs.current[baseId]?.pause();
      setPlayingId(null);
    } else {
      // Pausar qualquer outro áudio tocando
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      
      if (!audioRefs.current[baseId]) {
        audioRefs.current[baseId] = new Audio(fileUrl);
        audioRefs.current[baseId].onended = () => setPlayingId(null);
      }
      
      audioRefs.current[baseId].play();
      setPlayingId(baseId);
    }
  };

  const getGenreLabel = (genreValue: string) => {
    return GENRES.find(g => g.value === genreValue)?.label || genreValue;
  };

  // Placeholder images for bases without cover
  const getPlaceholderImage = (index: number) => {
    const placeholders = [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=600&fit=crop',
    ];
    return placeholders[index % placeholders.length];
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center size-10 rounded-full hover:bg-accent text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-foreground flex-1 text-center pr-10">
          Bases Musicais
        </h1>
      </header>

      <main className="flex-1 flex flex-col gap-8 p-4">
        {/* Cadastrar Nova Base */}
        <section className="flex flex-col gap-4 animate-fade-in">
          <h2 className="text-lg font-bold text-foreground leading-tight px-1">
            Cadastrar Nova Base
          </h2>
          
          <div className="bg-card border border-primary/30 rounded-xl p-5 flex flex-col gap-5 shadow-lg">
            {/* Título */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Título da Obra
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Batida Funk 2024"
                className="h-12 bg-background border-primary/30 focus:border-primary text-base"
              />
            </div>

            {/* Gênero */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Gênero
              </Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="h-12 bg-background border-primary/30 focus:border-primary text-base">
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload de Áudio */}
            <div className="mt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="audio-upload"
              />
              <label 
                htmlFor="audio-upload"
                className="block w-full cursor-pointer group"
              >
                <div className={`border-2 border-dashed ${selectedFile ? 'border-primary bg-primary/5' : 'border-primary/30 hover:border-primary/60'} bg-background rounded-xl py-8 px-4 flex flex-col items-center justify-center gap-3 transition-all duration-300`}>
                  <div className={`size-12 rounded-full ${selectedFile ? 'bg-primary/20' : 'bg-card'} flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 border border-border`}>
                    <Upload className={`h-6 w-6 ${selectedFile ? 'text-primary' : 'text-primary'}`} />
                  </div>
                  <div className="text-center">
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-bold text-primary transition-colors">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Toque para alterar
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          Toque para adicionar áudio
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Arquivos .mp3 ou .wav
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Botão Salvar */}
            <Button
              onClick={handleSaveBase}
              disabled={isSaving}
              className="mt-2 w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-lg shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Base'}</span>
            </Button>
          </div>
        </section>

        {/* Divisor */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Minhas Bases */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              Minhas Bases
            </h2>
            {bases.length > 4 && (
              <button className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide">
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : bases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-16 rounded-full bg-card flex items-center justify-center mb-4 border border-border">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Nenhuma base cadastrada ainda
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Adicione sua primeira base acima
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {bases.slice(0, 4).map((base, index) => (
                <div 
                  key={base.id}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-card border border-border shadow-md"
                >
                  {/* Imagem de fundo */}
                  <img 
                    src={getPlaceholderImage(index)}
                    alt={base.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
                  />
                  
                  {/* Gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  
                  {/* Ícone de status / Play */}
                  <div className="absolute top-2 right-2">
                    {base.file_url ? (
                      <button
                        onClick={() => togglePlay(base.id, base.file_url)}
                        className={`size-8 rounded-full ${playingId === base.id ? 'bg-primary text-primary-foreground' : 'bg-background/60 backdrop-blur-sm text-primary border border-border'} flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer`}
                      >
                        {playingId === base.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4 ml-0.5" />
                        )}
                      </button>
                    ) : (
                      <div className="size-7 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center border border-border text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col">
                    <span className="inline-flex self-start bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider mb-1.5 backdrop-blur-sm border border-primary/20">
                      {getGenreLabel(base.genre)}
                    </span>
                    <h3 className="text-foreground font-bold text-base leading-tight truncate">
                      {base.name}
                    </h3>
                    <p className="text-muted-foreground text-xs truncate mt-0.5 font-medium">
                      {base.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
