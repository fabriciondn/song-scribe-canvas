
import React, { useState } from 'react';
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
import { Plus, Users, Mail, User, Eye, Edit as EditIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Partner {
  id: string;
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
  partners: Partner[];
}

const INITIAL_PARTNERSHIPS: Partnership[] = [
  {
    id: '1',
    title: 'Canção do Verão',
    description: 'Parceria para composição pop com tema de verão',
    date: new Date().toLocaleDateString(),
    partners: [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
        permission: 'edit',
        status: 'active',
      }
    ]
  }
];

const Partnerships: React.FC = () => {
  const [partnerships, setPartnerships] = useState<Partnership[]>(INITIAL_PARTNERSHIPS);
  const [isNewPartnershipOpen, setIsNewPartnershipOpen] = useState(false);
  const [isInvitePartnerOpen, setIsInvitePartnerOpen] = useState(false);
  
  const [activePartnershipId, setActivePartnershipId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPermission, setPartnerPermission] = useState<'read' | 'edit'>('read');
  
  const { toast } = useToast();
  
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
  
  const handleCreatePartnership = () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, insira um título para a parceria.',
        variant: 'destructive',
      });
      return;
    }
    
    const newPartnership: Partnership = {
      id: Date.now().toString(),
      title,
      description,
      date: new Date().toLocaleDateString(),
      partners: [],
    };
    
    setPartnerships([...partnerships, newPartnership]);
    setIsNewPartnershipOpen(false);
    
    toast({
      title: 'Parceria criada',
      description: `A parceria "${title}" foi criada com sucesso.`,
    });
  };
  
  const handleInvitePartner = () => {
    if (!partnerEmail.trim()) {
      toast({
        title: 'E-mail obrigatório',
        description: 'Por favor, insira o e-mail do parceiro.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!activePartnershipId) return;
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      toast({
        title: 'E-mail inválido',
        description: 'Por favor, insira um e-mail válido.',
        variant: 'destructive',
      });
      return;
    }
    
    const newPartner: Partner = {
      id: Date.now().toString(),
      name: partnerEmail.split('@')[0], // Extract name from email
      email: partnerEmail,
      permission: partnerPermission,
      status: 'pending',
    };
    
    setPartnerships(partnerships.map(p => 
      p.id === activePartnershipId 
        ? { ...p, partners: [...p.partners, newPartner] } 
        : p
    ));
    
    setIsInvitePartnerOpen(false);
    
    toast({
      title: 'Convite enviado',
      description: `Um convite foi enviado para ${partnerEmail}.`,
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Parcerias</h2>
        <Button onClick={openNewPartnershipDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Parceria
        </Button>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={() => openInvitePartnerDialog(partnership.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Convidar
                    </Button>
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
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Abrir Compositor
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
      
      {/* Invite Partner Dialog */}
      <Dialog open={isInvitePartnerOpen} onOpenChange={setIsInvitePartnerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Parceiro</DialogTitle>
            <DialogDescription>
              Envie um convite para um compositor colaborar nesta parceria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail do Parceiro</Label>
              <div className="flex">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground self-center" />
                <Input
                  id="email"
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="parceiro@email.com"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="permission">Permissão</Label>
              <Select 
                value={partnerPermission} 
                onValueChange={(value) => setPartnerPermission(value as 'read' | 'edit')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma permissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Somente leitura</SelectItem>
                  <SelectItem value="edit">Leitura e edição</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {partnerPermission === 'read' 
                  ? 'O parceiro poderá apenas visualizar a composição, sem editar.' 
                  : 'O parceiro poderá visualizar e editar a composição.'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvitePartnerOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvitePartner}>
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Partnerships;
