
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Users, Mail, User, Eye, Edit as EditIcon, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  generateCollaborationToken, 
  validateCollaborationToken,
  getUserPartnerships
} from '@/services/drafts/draftService';

interface Partner {
  id: string;
  userId: string;
  name: string;
  email: string;
  permission: 'read' | 'edit';
  status: 'pending' | 'active';
}

interface Partnership {
  id: string;
  title: string;
  description: string;
  date: string;
  creator: {
    name: string;
    email: string;
  };
  partners: Partner[];
}

const Partnerships: React.FC = () => {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [isNewPartnershipOpen, setIsNewPartnershipOpen] = useState(false);
  const [isInvitePartnerOpen, setIsInvitePartnerOpen] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  
  const [activePartnershipId, setActivePartnershipId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPermission, setPartnerPermission] = useState<'read' | 'edit'>('read');
  
  const [collaborationToken, setCollaborationToken] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [isTokenCopied, setIsTokenCopied] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Load partnerships
  useEffect(() => {
    loadPartnerships();
  }, []);
  
  const loadPartnerships = async () => {
    try {
      const loadedPartnerships = await getUserPartnerships();
      setPartnerships(loadedPartnerships);
    } catch (error) {
      console.error('Error loading partnerships:', error);
      toast({
        title: 'Erro ao carregar parcerias',
        description: 'Não foi possível carregar as suas parcerias.',
        variant: 'destructive',
      });
    }
  };
  
  const openNewPartnershipDialog = () => {
    setTitle('');
    setDescription('');
    setIsNewPartnershipOpen(true);
  };
  
  const openInvitePartnerDialog = (partnershipId: string) => {
    setActivePartnershipId(partnershipId);
    setPartnerEmail('');
    setPartnerPermission('read');
    setIsInvitePartnerOpen(true);
  };
  
  const handleCreatePartnership = async () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, insira um título para a parceria.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create partnership in database
      const { data, error } = await supabase
        .from('partnerships')
        .insert({
          title,
          description: description || null,
          user_id: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Create empty composition
        await supabase
          .from('partnership_compositions')
          .insert({
            partnership_id: data.id,
            content: '',
            author_segments: []
          });
        
        // Refresh partnerships
        await loadPartnerships();
      }
      
      setIsNewPartnershipOpen(false);
      
      toast({
        title: 'Parceria criada',
        description: `A parceria "${title}" foi criada com sucesso.`,
      });
    } catch (error) {
      console.error('Error creating partnership:', error);
      toast({
        title: 'Erro ao criar parceria',
        description: 'Não foi possível criar a parceria.',
        variant: 'destructive',
      });
    }
  };
  
  const handleGenerateToken = async (partnershipId: string) => {
    try {
      const token = await generateCollaborationToken(partnershipId);
      setCollaborationToken(token);
      setActivePartnershipId(partnershipId);
      setIsTokenDialogOpen(true);
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: 'Erro ao gerar token',
        description: 'Não foi possível gerar o token de convite.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCopyToken = () => {
    navigator.clipboard.writeText(collaborationToken);
    setIsTokenCopied(true);
    setTimeout(() => setIsTokenCopied(false), 3000);
    
    toast({
      title: 'Token copiado!',
      description: 'O token foi copiado para a área de transferência.',
    });
  };
  
  const handleJoinPartnership = async () => {
    if (!joinToken.trim()) {
      toast({
        title: 'Token obrigatório',
        description: 'Por favor, insira o token de parceria.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsValidatingToken(true);
    
    try {
      const result = await validateCollaborationToken(joinToken);
      
      if (result.valid && result.partnershipId) {
        toast({
          title: 'Parceria acessada!',
          description: 'Você agora tem acesso à parceria.',
        });
        
        setIsJoinDialogOpen(false);
        setJoinToken('');
        
        // Refresh partnerships
        await loadPartnerships();
      } else {
        toast({
          title: 'Token inválido',
          description: result.error || 'O token fornecido não é válido ou expirou.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: 'Erro ao validar token',
        description: 'Não foi possível validar o token de parceria.',
        variant: 'destructive',
      });
    } finally {
      setIsValidatingToken(false);
    }
  };
  
  const openCollaborativeEditor = (partnershipId: string) => {
    // Navigate to collaborative editor with partnership ID
    navigate(`/composer?partnership=${partnershipId}`);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Parcerias</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsJoinDialogOpen(true)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Entrar com Token
          </Button>
          <Button onClick={openNewPartnershipDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Parceria
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partnerships.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>Você ainda não possui parcerias. Crie uma agora!</p>
          </div>
        ) : (
          partnerships.map(partnership => (
            <Card key={partnership.id}>
              <CardHeader>
                <CardTitle>{partnership.title}</CardTitle>
                <CardDescription>
                  Criado em {partnership.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  {partnership.description || <span className="text-muted-foreground italic">Sem descrição</span>}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Parceiros</h4>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGenerateToken(partnership.id)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Token
                      </Button>
                    </div>
                  </div>
                  
                  {partnership.partners.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      Nenhum parceiro adicionado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {partnership.partners.map(partner => (
                        <div 
                          key={partner.id} 
                          className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                        >
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{partner.name}</p>
                              <p className="text-xs text-muted-foreground">{partner.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span 
                              className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                                partner.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              }`}
                            >
                              {partner.status === 'active' ? 'Ativo' : 'Pendente'}
                            </span>
                            {partner.permission === 'edit' ? (
                              <EditIcon className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Eye className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => openCollaborativeEditor(partnership.id)}
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Abrir Compositor Colaborativo
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* New Partnership Dialog */}
      <Dialog open={isNewPartnershipOpen} onOpenChange={setIsNewPartnershipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Parceria</DialogTitle>
            <DialogDescription>
              Crie uma nova parceria para colaborar com outros compositores.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título da Parceria</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nova Canção Pop"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o propósito desta parceria..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPartnershipOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePartnership}>
              Criar Parceria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Token Dialog */}
      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token de Convite</DialogTitle>
            <DialogDescription>
              Compartilhe este token com outro compositor para que ele possa se juntar à parceria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="token">Token de Colaboração</Label>
              <div className="flex">
                <Input
                  id="token"
                  value={collaborationToken}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={handleCopyToken}
                >
                  {isTokenCopied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este token é válido por 7 dias e só pode ser usado uma vez.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsTokenDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Join Partnership Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar em uma Parceria</DialogTitle>
            <DialogDescription>
              Insira o token de convite que você recebeu para acessar uma parceria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="join-token">Token de Parceria</Label>
              <Input
                id="join-token"
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                placeholder="Insira o token aqui"
                className="font-mono"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleJoinPartnership}
              disabled={isValidatingToken}
            >
              {isValidatingToken ? 'Validando...' : 'Entrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Partnerships;
