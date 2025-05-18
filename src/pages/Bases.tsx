
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Folder, Music, Plus, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Types for Base folders and files
interface BaseFile {
  id: string;
  name: string;
  genre: string;
  description: string;
  fileUrl: string;
}

interface BaseFolder {
  id: string;
  name: string;
  description: string;
  files: BaseFile[];
}

// Mock data for demonstration
const mockFolders: BaseFolder[] = [
  {
    id: '1',
    name: 'Piseiro',
    description: 'Bases de piseiro para composição',
    files: [
      { 
        id: '101', 
        name: 'Piseiro Base 1', 
        genre: 'Piseiro', 
        description: 'Base de piseiro com 120 BPM', 
        fileUrl: '/lovable-uploads/bases/piseiro1.mp3' 
      },
      { 
        id: '102', 
        name: 'Piseiro Base 2', 
        genre: 'Piseiro', 
        description: 'Base de piseiro com 110 BPM', 
        fileUrl: '/lovable-uploads/bases/piseiro2.mp3' 
      }
    ]
  },
  {
    id: '2',
    name: 'Sertanejo',
    description: 'Bases de sertanejo para composição',
    files: [
      { 
        id: '201', 
        name: 'Sertanejo Base 1', 
        genre: 'Sertanejo', 
        description: 'Base de sertanejo universitário', 
        fileUrl: '/lovable-uploads/bases/sertanejo1.mp3' 
      }
    ]
  }
];

const Bases: React.FC = () => {
  const [folders, setFolders] = useState<BaseFolder[]>(mockFolders);
  const [newFolder, setNewFolder] = useState({ name: '', description: '' });
  const [selectedFolder, setSelectedFolder] = useState<BaseFolder | null>(null);
  const [newBase, setNewBase] = useState({ name: '', genre: '', description: '', file: null as File | null });
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isAddingBase, setIsAddingBase] = useState(false);
  
  const { toast } = useToast();
  
  const handleAddFolder = () => {
    if (!newFolder.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da pasta é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    const newFolderData: BaseFolder = {
      id: Date.now().toString(),
      name: newFolder.name,
      description: newFolder.description,
      files: []
    };
    
    setFolders(prev => [...prev, newFolderData]);
    setNewFolder({ name: '', description: '' });
    setIsAddingFolder(false);
    
    toast({
      title: "Pasta criada",
      description: `A pasta "${newFolder.name}" foi criada com sucesso`
    });
  };
  
  const handleAddBase = () => {
    if (!selectedFolder) return;
    if (!newBase.name.trim() || !newBase.genre.trim()) {
      toast({
        title: "Erro",
        description: "Nome e gênero são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    if (!newBase.file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de áudio",
        variant: "destructive"
      });
      return;
    }
    
    // In a real application, we would upload the file to a server/storage here
    // For this mockup, we'll simulate the upload
    const newBaseFile: BaseFile = {
      id: Date.now().toString(),
      name: newBase.name,
      genre: newBase.genre,
      description: newBase.description,
      fileUrl: URL.createObjectURL(newBase.file) // Temporary URL for demonstration
    };
    
    setFolders(prev => prev.map(folder => 
      folder.id === selectedFolder.id 
        ? { ...folder, files: [...folder.files, newBaseFile] } 
        : folder
    ));
    
    setNewBase({ name: '', genre: '', description: '', file: null });
    setIsAddingBase(false);
    
    toast({
      title: "Base adicionada",
      description: `A base "${newBase.name}" foi adicionada à pasta "${selectedFolder.name}"`
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewBase(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Minhas Bases Musicais</h1>
        
        <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" /> Nova Pasta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Pasta</DialogTitle>
              <DialogDescription>
                Crie uma nova pasta para organizar suas bases musicais.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="folder-name">Nome da Pasta</Label>
                <Input
                  id="folder-name"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Sertanejo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="folder-description">Descrição (opcional)</Label>
                <Textarea
                  id="folder-description"
                  value={newFolder.description}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o conteúdo desta pasta..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingFolder(false)}>Cancelar</Button>
              <Button onClick={handleAddFolder}>Criar Pasta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <Card key={folder.id} className="overflow-hidden">
            <CardHeader className="bg-slate-50">
              <div className="flex items-center gap-2">
                <Folder className="text-purple-500" />
                <CardTitle>{folder.name}</CardTitle>
              </div>
              <CardDescription>{folder.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">
                {folder.files.length} base{folder.files.length !== 1 ? 's' : ''}
              </p>
              
              <div className="space-y-2">
                {folder.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-md">
                    <div className="flex items-center">
                      <Music className="mr-2 h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.genre}</p>
                      </div>
                    </div>
                    <audio
                      controls
                      className="h-8 w-36"
                      preload="none"
                      src={file.fileUrl}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end bg-slate-50 py-3">
              <Dialog open={isAddingBase && selectedFolder?.id === folder.id} onOpenChange={(open) => {
                setIsAddingBase(open);
                if (open) setSelectedFolder(folder);
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setSelectedFolder(folder)}>
                    <Upload className="mr-2 h-4 w-4" /> Adicionar Base
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Base Musical</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova base musical à pasta "{folder.name}"
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="base-name">Nome da Base</Label>
                      <Input
                        id="base-name"
                        value={newBase.name}
                        onChange={(e) => setNewBase(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Base de Piseiro 120 BPM"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="base-genre">Gênero</Label>
                      <Input
                        id="base-genre"
                        value={newBase.genre}
                        onChange={(e) => setNewBase(prev => ({ ...prev, genre: e.target.value }))}
                        placeholder="Ex: Piseiro"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="base-description">Descrição (opcional)</Label>
                      <Textarea
                        id="base-description"
                        value={newBase.description}
                        onChange={(e) => setNewBase(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva esta base musical..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="base-file">Arquivo MP3</Label>
                      <Input
                        id="base-file"
                        type="file"
                        accept=".mp3,audio/*"
                        onChange={handleFileChange}
                      />
                      <p className="text-xs text-muted-foreground">Tamanho máximo: 10MB</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingBase(false)}>Cancelar</Button>
                    <Button onClick={handleAddBase}>Adicionar Base</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Folder className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhuma pasta de bases</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            Crie pastas para organizar suas bases musicais e utilizá-las em suas composições.
          </p>
          <Button onClick={() => setIsAddingFolder(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar Primeira Pasta
          </Button>
        </div>
      )}
    </div>
  );
};

export default Bases;
