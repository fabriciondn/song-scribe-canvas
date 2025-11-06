import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Check, 
  X, 
  Eye, 
  Search, 
  Filter,
  MessageCircle,
  ExternalLink,
  Star,
  TrendingUp,
  Percent,
  UserCog,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import AffiliateReferralsModal from './AffiliateReferralsModal';
import { ImpersonateButton } from '@/components/ui/impersonate-button';

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  level: 'bronze' | 'silver' | 'gold';
  full_name: string;
  whatsapp: string;
  contact_email: string;
  social_media_link?: string;
  youtube_link?: string;
  tiktok_link?: string;
  website_link?: string;
  promotion_strategy: string;
  total_registrations: number;
  total_earnings: number;
  custom_commission_rate?: number;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
}

export const AdminAffiliates = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [isReferralsModalOpen, setIsReferralsModalOpen] = useState(false);
  const [selectedAffiliateForReferrals, setSelectedAffiliateForReferrals] = useState<{ id: string; name: string } | null>(null);
  const [isValidatingCommissions, setIsValidatingCommissions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar afiliados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCommissions = async () => {
    setIsValidatingCommissions(true);
    try {
      console.log('🔍 Executando validação manual de comissões...');
      
      const { data, error } = await supabase.functions.invoke('validate-affiliate-commissions');

      if (error) throw error;

      const result = data as any;
      
      toast({
        title: "✅ Validação Concluída",
        description: `${result.result.approved} comissões aprovadas, ${result.result.cancelled} canceladas`,
      });

      console.log('✅ Resultado da validação:', result);
      
      // Recarregar afiliados para atualizar saldos
      loadAffiliates();
      
    } catch (error) {
      console.error('❌ Erro ao validar comissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar comissões",
        variant: "destructive"
      });
    } finally {
      setIsValidatingCommissions(false);
    }
  };

  const handleApprove = async (affiliate: Affiliate) => {
    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', affiliate.id);

      if (error) throw error;

      // TODO: Implementar envio de WhatsApp
      toast({
        title: "Afiliado aprovado!",
        description: `${affiliate.full_name} foi aprovado como afiliado.`
      });

      loadAffiliates();
    } catch (error) {
      console.error('Error approving affiliate:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar afiliado",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (affiliate: Affiliate) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da reprovação",
        variant: "destructive"
      });
      return;
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', affiliate.id);

      if (error) throw error;

      // TODO: Implementar envio de WhatsApp
      toast({
        title: "Afiliado rejeitado",
        description: `A solicitação de ${affiliate.full_name} foi rejeitada.`
      });

      setRejectionReason('');
      setShowDetailsModal(false);
      loadAffiliates();
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar afiliado",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
      suspended: { label: 'Suspenso', variant: 'destructive' as const }
    };
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      bronze: { label: 'Bronze', className: 'bg-amber-600' },
      silver: { label: 'Silver', className: 'bg-gray-400' },
      gold: { label: 'Gold', className: 'bg-yellow-500' }
    };
    const config = variants[level as keyof typeof variants];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getCommissionRate = (affiliate: Affiliate) => {
    if (affiliate.custom_commission_rate) {
      return `${affiliate.custom_commission_rate}%*`;
    }
    return affiliate.level === 'bronze' ? '25%' : '50%';
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = affiliate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = affiliates.filter(a => a.status === 'pending').length;
  const approvedCount = affiliates.filter(a => a.status === 'approved').length;
  const rejectedCount = affiliates.filter(a => a.status === 'rejected' || a.status === 'suspended').length;

  if (loading) {
    return <div className="p-6">Carregando afiliados...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{affiliates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejeitados/Suspensos</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, email ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
                <option value="suspended">Suspensos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Afiliados ({filteredAffiliates.length})</CardTitle>
            <Button
              onClick={handleValidateCommissions}
              disabled={isValidatingCommissions}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isValidatingCommissions ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Validar Comissões (90 dias)
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Gerencie afiliados e suas comissões. Validação automática verifica se indicados registraram obras em 90 dias. * = comissão personalizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Comissão
                  </div>
                </TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Ganhos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAffiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell className="font-medium">{affiliate.full_name}</TableCell>
                  <TableCell>{affiliate.contact_email}</TableCell>
                  <TableCell>{affiliate.whatsapp}</TableCell>
                  <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                  <TableCell>{getLevelBadge(affiliate.level)}</TableCell>
                  <TableCell>
                    <Badge variant={affiliate.custom_commission_rate ? "secondary" : "outline"}>
                      {getCommissionRate(affiliate)}
                    </Badge>
                  </TableCell>
                  <TableCell>{affiliate.total_registrations}</TableCell>
                  <TableCell>R$ {Number(affiliate.total_earnings || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <ImpersonateButton
                        targetUser={{
                          id: affiliate.user_id,
                          email: affiliate.contact_email || '',
                          name: affiliate.full_name || '',
                          artistic_name: null
                        }}
                        targetRole="user"
                        variant="outline"
                        size="sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setShowDetailsModal(true);
                        }}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAffiliateForReferrals({
                            id: affiliate.id,
                            name: affiliate.full_name,
                          });
                          setIsReferralsModalOpen(true);
                        }}
                        title="Ver usuários indicados"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      {affiliate.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(affiliate)}
                            disabled={processingAction}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Afiliado</DialogTitle>
            <DialogDescription>
              Informações completas da solicitação
            </DialogDescription>
          </DialogHeader>
          
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <p className="font-medium">{selectedAffiliate.full_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedAffiliate.contact_email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>WhatsApp</Label>
                  <p className="font-medium">{selectedAffiliate.whatsapp}</p>
                </div>
                <div>
                  <Label>Código de Afiliado</Label>
                  <p className="font-medium">{selectedAffiliate.affiliate_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedAffiliate.status)}</div>
                </div>
                <div>
                  <Label>Nível</Label>
                  <div>{getLevelBadge(selectedAffiliate.level)}</div>
                </div>
                <div>
                  <Label>Comissão</Label>
                  <Badge variant={selectedAffiliate.custom_commission_rate ? "secondary" : "outline"}>
                    {getCommissionRate(selectedAffiliate)}
                  </Badge>
                  {selectedAffiliate.custom_commission_rate && (
                    <p className="text-xs text-muted-foreground mt-1">Personalizada</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <Label>Total de Registros</Label>
                  <p className="text-2xl font-bold">{selectedAffiliate.total_registrations}</p>
                </div>
                <div>
                  <Label>Total de Ganhos</Label>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {Number(selectedAffiliate.total_earnings || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Links de Redes Sociais */}
              <div className="space-y-2">
                <Label>Redes Sociais</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedAffiliate.social_media_link && (
                    <div>
                      <span className="text-muted-foreground">Instagram/Facebook:</span>
                      <a href={selectedAffiliate.social_media_link} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-1">
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </div>
                  )}
                  {selectedAffiliate.youtube_link && (
                    <div>
                      <span className="text-muted-foreground">YouTube:</span>
                      <a href={selectedAffiliate.youtube_link} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-1">
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </div>
                  )}
                  {selectedAffiliate.tiktok_link && (
                    <div>
                      <span className="text-muted-foreground">TikTok:</span>
                      <a href={selectedAffiliate.tiktok_link} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-1">
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </div>
                  )}
                  {selectedAffiliate.website_link && (
                    <div>
                      <span className="text-muted-foreground">Site:</span>
                      <a href={selectedAffiliate.website_link} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-1">
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Estratégia de Promoção</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedAffiliate.promotion_strategy}</p>
              </div>

              {selectedAffiliate.rejection_reason && (
                <div>
                  <Label>Motivo da Rejeição</Label>
                  <p className="text-sm mt-1 p-3 bg-destructive/10 rounded text-destructive">
                    {selectedAffiliate.rejection_reason}
                  </p>
                </div>
              )}

              {selectedAffiliate.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="rejectionReason">Motivo da reprovação (se aplicável)</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Informe o motivo da reprovação..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleApprove(selectedAffiliate)}
                      disabled={processingAction}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedAffiliate)}
                      disabled={processingAction || !rejectionReason.trim()}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedAffiliateForReferrals && (
        <AffiliateReferralsModal
          isOpen={isReferralsModalOpen}
          onClose={() => {
            setIsReferralsModalOpen(false);
            setSelectedAffiliateForReferrals(null);
          }}
          affiliateId={selectedAffiliateForReferrals.id}
          affiliateName={selectedAffiliateForReferrals.name}
        />
      )}
    </div>
  );
};