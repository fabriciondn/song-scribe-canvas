
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, File, Folder, Plus, Trash2, Edit, FileText, Printer, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Folder as FolderType, Song, getFolderById, getSongsInFolder, createSong, updateSong, deleteSong } from '@/services/folderService';
import { Skeleton } from '@/components/ui/skeleton';

export const FolderPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [folder, setFolder] = useState<FolderType | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  const [isNewSongDialogOpen, setIsNewSongDialogOpen] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongContent, setNewSongContent] = useState('');

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  // Carregar pasta e músicas
  useEffect(() => {
    if (!folderId || !isAuthenticated) return;

    const loadFolderAndSongs = async () => {
      setIsLoading(true);
      try {
        const folderData = await getFolderById(folderId);
        if (folderData) {
          setFolder(folderData);
          
          const songsData = await getSongsInFolder(folderId);
          setSongs(songsData);
          
          if (songsData.length > 0 && !selectedSong) {
            setSelectedSong(songsData[0]);
          }
        } else {
          toast({
            title: 'Pasta não encontrada',
            description: 'A pasta que você está procurando não existe.',
            variant: 'destructive',
          });
          navigate('/folders');
        }
      } catch (error) {
        console.error('Erro ao carregar pasta e músicas:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as informações da pasta.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFolderAndSongs();
  }, [folderId, isAuthenticated, navigate, toast]);

  // Função para visualizar a música em formato PDF
  const handleViewAsPdf = () => {
    if (selectedSong) {
      setIsPdfDialogOpen(true);
    }
  };

  // Função para imprimir ou salvar como PDF
  const handlePrint = () => {
    if (!pdfContentRef.current) return;
    
    const originalContents = document.body.innerHTML;
    const printContent = pdfContentRef.current.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Re-renderiza o componente após a impressão
    window.location.reload();
  };

  const handleBackClick = () => {
    navigate('/folders');
  };

  const handleSongClick = (song: Song) => {
    setSelectedSong(song);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (selectedSong) {
      setEditTitle(selectedSong.title);
      setEditContent(selectedSong.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedSong && (editTitle.trim() || editContent.trim())) {
      try {
        const updates: { title?: string; content?: string } = {};
        if (editTitle.trim()) updates.title = editTitle;
        if (editContent.trim()) updates.content = editContent;
        
        const updatedSong = await updateSong(selectedSong.id, updates);
        
        setSongs(prevSongs => prevSongs.map(song => 
          song.id === updatedSong.id ? updatedSong : song
        ));
        setSelectedSong(updatedSong);
        setIsEditing(false);
        
        toast({
          title: 'Música atualizada',
          description: 'Suas alterações foram salvas com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao atualizar música:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível atualizar a música.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!songId) return;
    
    try {
      await deleteSong(songId);
      
      const updatedSongs = songs.filter(song => song.id !== songId);
      setSongs(updatedSongs);
      
      if (selectedSong?.id === songId) {
        setSelectedSong(updatedSongs.length > 0 ? updatedSongs[0] : null);
      }
      
      toast({
        title: 'Música excluída',
        description: 'A música foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir música:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a música.',
        variant: 'destructive',
      });
    }
  };

  const handleAddNewSong = () => {
    setNewSongTitle('');
    setNewSongContent('');
    setIsNewSongDialogOpen(true);
  };

  const handleSaveNewSong = async () => {
    if (!folderId || !newSongTitle.trim()) {
      toast({
        title: 'Informações incompletas',
        description: 'Por favor, adicione um título para a música.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const newSong = await createSong({
        title: newSongTitle.trim(),
        content: newSongContent.trim(),
        folder_id: folderId
      });
      
      setSongs(prevSongs => [newSong, ...prevSongs]);
      setSelectedSong(newSong);
      setIsNewSongDialogOpen(false);
      
      toast({
        title: 'Música criada',
        description: 'Sua nova composição foi criada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar música:', error);
      toast({
        title: 'Erro ao criar música',
        description: 'Não foi possível criar a nova composição.',
        variant: 'destructive',
      });
    }
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

  // Função para formatar o conteúdo da música para o PDF
  const formatSongContentForPdf = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => (
      <p key={index} className={line.trim() === '' ? 'my-4' : 'my-1'}>
        {line || '\u00A0'}
      </p>
    ));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-6">
        <Button 
          variant="outline" 
          className="mb-4 flex items-center opacity-60" 
          disabled
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Carregando...
        </Button>

        <div className="mb-6">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full mr-2" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-4 w-24 mt-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex justify-center items-center h-64 px-6">
        <p>Pasta não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-6">
      <Button 
        variant="outline" 
        className="mb-6 flex items-center" 
        onClick={handleBackClick}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Pastas
      </Button>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Folder className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold">{folder.name}</h1>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90" onClick={handleAddNewSong}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Composição
        </Button>
      </div>
      
      <p className="text-muted-foreground mb-8">
        {songs.length} {songs.length === 1 ? 'composição' : 'composições'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Composições</h2>
          
          {songs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Esta pasta está vazia.</p>
                <p className="mt-2">Clique em "Nova Composição" para começar.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {songs.map(song => (
                <Card 
                  key={song.id}
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedSong?.id === song.id ? 'border-primary shadow-sm' : ''
                  }`}
                >
                  <CardContent className="p-4" onClick={() => handleSongClick(song)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center overflow-hidden">
                        <File className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-medium truncate">{song.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(song.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="ml-2 opacity-70 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSong(song);
                            handleViewAsPdf();
                          }}
                        >
                          <FileText className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="ml-1 opacity-70 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSong(song.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
            <Card className="h-full">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{!isEditing ? selectedSong.title : 'Editando Composição'}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Criado em {formatDate(selectedSong.created_at)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center"
                    onClick={handleViewAsPdf}
                  >
                    <FileText className="h-4 w-4 mr-2" /> 
                    Visualizar PDF
                  </Button>
                  {!isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleEditClick}
                    >
                      <Edit className="h-4 w-4 mr-2" /> 
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <Textarea 
                    value={selectedSong.content}
                    readOnly
                    className="min-h-[450px] font-mono resize-none"
                  />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-title" className="block text-sm font-medium mb-1">
                        Título
                      </label>
                      <Input
                        id="edit-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título da composição"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-content" className="block text-sm font-medium mb-1">
                        Conteúdo
                      </label>
                      <Textarea
                        id="edit-content"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Letra da música"
                        className="min-h-[400px] font-mono resize-none"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              {isEditing && (
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveEdit}>
                    Salvar Alterações
                  </Button>
                </CardFooter>
              )}
            </Card>
          ) : (
            <div className="border rounded-lg p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <File className="h-12 w-12 mb-2 opacity-50" />
              <h3 className="text-lg font-medium">Nenhuma composição selecionada</h3>
              <p>Selecione uma composição para visualizar seu conteúdo ou crie uma nova.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para adicionar nova música */}
      <Dialog open={isNewSongDialogOpen} onOpenChange={setIsNewSongDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Composição</DialogTitle>
            <DialogDescription>
              Adicione uma nova composição à sua pasta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="song-title" className="text-sm font-medium leading-none">
                Título da composição
              </label>
              <Input
                id="song-title"
                placeholder="Insira o título"
                value={newSongTitle}
                onChange={(e) => setNewSongTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="song-content" className="text-sm font-medium leading-none">
                Letra da música
              </label>
              <Textarea
                id="song-content"
                placeholder="Insira a letra da música"
                value={newSongContent}
                onChange={(e) => setNewSongContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSongDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveNewSong}>Criar Composição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar música como PDF */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualização de PDF</DialogTitle>
            <DialogDescription>
              Visualize e imprima sua composição em formato PDF.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] w-full">
            <div className="border rounded-lg p-8 bg-white mx-2" ref={pdfContentRef}>
              {selectedSong && (
                <div className="pdf-content space-y-6">
                  <h1 className="text-2xl font-bold text-center mb-8">{selectedSong.title}</h1>
                  <div className="text-sm text-right mb-6">
                    Criado em: {formatDate(selectedSong.created_at)}
                  </div>
                  <div className="my-8 text-base whitespace-pre-wrap font-mono leading-relaxed">
                    {formatSongContentForPdf(selectedSong.content)}
                  </div>
                  <div className="mt-12 pt-8 border-t text-xs text-center text-gray-500">
                    Documento gerado pelo Compuse - {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>
              Fechar
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handlePrint} className="flex items-center">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir PDF
              </Button>
              <Button onClick={handlePrint} className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Salvar PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
