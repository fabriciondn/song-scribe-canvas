
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Folder, File, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface Song {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface FolderData {
  id: string;
  name: string;
  songs: string[];
}

export const FolderPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [folder, setFolder] = useState<FolderData | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  useEffect(() => {
    if (!folderId) return;

    // Load folder data from localStorage
    const savedFolders = JSON.parse(localStorage.getItem('folders') || '[]');
    const currentFolder = savedFolders.find((f: FolderData) => f.id === folderId);
    
    if (currentFolder) {
      setFolder(currentFolder);
      
      // Load songs for this folder
      const savedSongs = localStorage.getItem(`folder_${folderId}`);
      if (savedSongs) {
        setSongs(JSON.parse(savedSongs));
      }
    } else {
      toast({
        title: 'Pasta não encontrada',
        description: 'A pasta que você está procurando não existe.',
        variant: 'destructive',
      });
      navigate('/folders');
    }
  }, [folderId, navigate, toast]);

  const handleBackClick = () => {
    navigate('/folders');
  };

  const handleSongClick = (song: Song) => {
    setSelectedSong(song);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!folder) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="outline" 
        className="mb-4 flex items-center" 
        onClick={handleBackClick}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Pastas
      </Button>

      <div className="mb-6">
        <div className="flex items-center">
          <Folder className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-3xl font-bold">{folder.name}</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          {songs.length} {songs.length === 1 ? 'composição' : 'composições'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Composições</h2>
          
          {songs.length === 0 ? (
            <p className="text-muted-foreground">Esta pasta está vazia.</p>
          ) : (
            <div className="space-y-2">
              {songs.map(song => (
                <Card 
                  key={song.id}
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedSong?.id === song.id ? 'border-primary' : ''
                  }`}
                  onClick={() => handleSongClick(song)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <File className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(song.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {selectedSong ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{selectedSong.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Criado em {formatDate(selectedSong.createdAt)}
                </p>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={selectedSong.content}
                  readOnly
                  className="min-h-[400px] font-mono"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <File className="h-12 w-12 mb-2 opacity-50" />
              <h3 className="text-lg font-medium">Nenhuma composição selecionada</h3>
              <p>Selecione uma composição para visualizar seu conteúdo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
