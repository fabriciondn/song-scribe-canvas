
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
import { TokenExpirationSelector } from '@/components/partnerships/TokenExpirationSelector';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  generateCollaborationToken, 
  validateCollaborationToken,
  getUserPartnerships
} from '@/services/drafts/draftService';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';

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
  const [tokenExpirationHours, setTokenExpirationHours] = useState(168);
  
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
      
      // Ensure that creator.name is never undefined
      const formattedPartnerships = loadedPartnerships.map(partnership => ({
        ...partnership,
        creator: {
          name: partnership.creator.name || 'Unknown',
          email: partnership.creator.email || '',
        }
      }));
      
      setPartnerships(formattedPartnerships as Partnership[]);
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
      const token = await generateCollaborationToken(partnershipId, tokenExpirationHours);
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
    <ProOnlyWrapper featureName="Parcerias">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Parcerias</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsJoinDialogOpen(true)}
            size="sm"
            className="text-xs sm:text-sm"
          >
            <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Entrar com Token</span>
            <span className="sm:hidden">Token</span>
          </Button>
          <Button onClick={openNewPartnershipDialog} size="sm" className="text-xs sm:text-sm">
            <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Nova Parceria</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {partnerships.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>Você ainda não possui parcerias. Crie uma agora!</p>
          </div>
        ) : (
          partnerships.map(partnership => (
            <Card key={partnership.id} className="sm:max-w-none">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg truncate">{partnership.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Criado em {partnership.date}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm">
                  {partnership.description ? (
                    <span className="line-clamp-2">{partnership.description}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Sem descrição</span>
                  )}
                </p>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-medium">Parceiros</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 sm:h-8 text-xs px-2"
                      onClick={() => handleGenerateToken(partnership.id)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Token
                    </Button>
                  </div>
                  
                  {partnership.partners.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      Nenhum parceiro
                    </p>
                  ) : (
                    <div className="space-y-1 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                      {partnership.partners.map(partner => (
                        <div 
                          key={partner.id} 
                          className="flex items-center justify-between p-2 bg-muted rounded-md text-xs sm:text-sm"
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{partner.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{partner.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span 
                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                partner.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              }`}
                            >
                              {partner.status === 'active' ? 'Ativo' : 'Pend'}
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
              <CardFooter className="pt-3 sm:pt-6">
                <Button 
                  variant="default" 
                  className="w-full text-xs sm:text-sm h-8 sm:h-10"
                  onClick={() => openCollaborativeEditor(partnership.id)}
                >
                  <EditIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Abrir Compositor Colaborativo</span>
                  <span className="sm:hidden">Compositor</span>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* New Partnership Dialog */}
      <Dialog open={isNewPartnershipOpen} onOpenChange={setIsNewPartnershipOpen}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Nova Parceria</DialogTitle>
            <DialogDescription className="text-sm">
              Crie uma nova parceria para colaborar com outros compositores.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm">Título da Parceria</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nova Canção Pop"
                className="text-sm"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm">Descrição (opcional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o propósito..."
                className="text-sm"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsNewPartnershipOpen(false)} className="text-sm">
              Cancelar
            </Button>
            <Button onClick={handleCreatePartnership} className="text-sm">
              Criar Parceria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Token Dialog */}
      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Token de Convite</DialogTitle>
            <DialogDescription className="text-sm">
              Compartilhe este token para que outro compositor possa se juntar à parceria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <TokenExpirationSelector 
              value={tokenExpirationHours} 
              onChange={setTokenExpirationHours} 
            />
            <div className="grid gap-2">
              <Label htmlFor="token" className="text-sm">Token de Colaboração</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="token"
                  value={collaborationToken}
                  readOnly
                  className="font-mono text-xs sm:text-sm flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyToken}
                  className="text-sm px-3"
                >
                  {isTokenCopied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Token de uso único.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsTokenDialogOpen(false)} className="text-sm">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Join Partnership Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Entrar em uma Parceria</DialogTitle>
            <DialogDescription className="text-sm">
              Insira o token de convite que você recebeu para acessar uma parceria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-2">
              <Label htmlFor="join-token" className="text-sm">Token de Parceria</Label>
              <Input
                id="join-token"
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                placeholder="Insira o token aqui"
                className="font-mono text-xs sm:text-sm"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)} className="text-sm">
              Cancelar
            </Button>
            <Button 
              onClick={handleJoinPartnership}
              disabled={isValidatingToken}
              className="text-sm"
            >
              {isValidatingToken ? 'Validando...' : 'Entrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ProOnlyWrapper>
  );
};

export default Partnerships;
