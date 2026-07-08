import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  TrendingUp,
  Percent,
  RefreshCw,
  CheckCircle2,
  Filter,
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

/* ---------- Premium primitives (same DS as UsersByPlanModal) ---------- */

const StatTile: React.FC<{
  kicker: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  tint: string;
  dot: string;
}> = ({ kicker, value, hint, icon: Icon, tint, dot }) => (
  <div
    className="relative overflow-hidden rounded-2xl p-4 bg-white/[0.025]
               shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]"
  >
    <div className={`absolute inset-0 pointer-events-none ${tint}`} />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{kicker}</span>
        </div>
        <p className="mt-2 text-[26px] leading-none font-light tracking-tight text-white tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-1.5 text-[11px] text-white/45">{hint}</p>}
      </div>
      <Icon className="h-7 w-7 text-white/40" strokeWidth={1.4} />
    </div>
  </div>
);

const Panel: React.FC<{
  children: React.ReactNode;
  className?: string;
  tint?: string;
}> = ({ children, className = '', tint }) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/[0.05]
                shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_36px_-25px_rgba(0,0,0,0.6)]
                ${className}`}
  >
    {tint && <div className={`absolute inset-0 pointer-events-none ${tint}`} />}
    <div className="relative">{children}</div>
  </div>
);

const StatusPill: React.FC<{ status: Affiliate['status'] }> = ({ status }) => {
  const map = {
    pending: { label: 'Pendente', cls: 'bg-amber-400/10 text-amber-300 ring-amber-400/20' },
    approved: { label: 'Aprovado', cls: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20' },
    rejected: { label: 'Rejeitado', cls: 'bg-red-400/10 text-red-300 ring-red-400/20' },
    suspended: { label: 'Suspenso', cls: 'bg-red-400/10 text-red-300 ring-red-400/20' },
  } as const;
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ring-1 ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};

const LevelPill: React.FC<{ level: Affiliate['level'] }> = ({ level }) => {
  const map = {
    bronze: { label: 'Bronze', cls: 'bg-amber-700/15 text-amber-300 ring-amber-700/30' },
    silver: { label: 'Silver', cls: 'bg-white/[0.06] text-white/70 ring-white/15' },
    gold: { label: 'Gold', cls: 'bg-yellow-400/10 text-yellow-300 ring-yellow-400/25' },
  } as const;
  const cfg = map[level];
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ring-1 ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};

/* ---------- Component ---------- */

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
        title: 'Erro',
        description: 'Erro ao carregar afiliados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCommissions = async () => {
    setIsValidatingCommissions(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-affiliate-commissions');
      if (error) throw error;
      const result = data as any;
      toast({
        title: '✅ Validação Concluída',
        description: `${result.result.approved} comissões aprovadas, ${result.result.cancelled} canceladas`,
      });
      loadAffiliates();
    } catch (error) {
      console.error('❌ Erro ao validar comissões:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao validar comissões',
        variant: 'destructive',
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
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', affiliate.id);
      if (error) throw error;
      toast({ title: 'Afiliado aprovado!', description: `${affiliate.full_name} foi aprovado como afiliado.` });
      loadAffiliates();
    } catch (error) {
      console.error('Error approving affiliate:', error);
      toast({ title: 'Erro', description: 'Erro ao aprovar afiliado', variant: 'destructive' });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (affiliate: Affiliate) => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Motivo obrigatório', description: 'Por favor, informe o motivo da reprovação', variant: 'destructive' });
      return;
    }
    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'rejected', rejection_reason: rejectionReason })
        .eq('id', affiliate.id);
      if (error) throw error;
      toast({ title: 'Afiliado rejeitado', description: `A solicitação de ${affiliate.full_name} foi rejeitada.` });
      setRejectionReason('');
      setShowDetailsModal(false);
      loadAffiliates();
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      toast({ title: 'Erro', description: 'Erro ao rejeitar afiliado', variant: 'destructive' });
    } finally {
      setProcessingAction(false);
    }
  };

  const getCommissionRate = (affiliate: Affiliate) => {
    if (affiliate.custom_commission_rate) return `${affiliate.custom_commission_rate}%*`;
    return affiliate.level === 'bronze' ? '25%' : '50%';
  };

  const filteredAffiliates = affiliates.filter((affiliate) => {
    const matchesSearch =
      affiliate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = affiliates.filter((a) => a.status === 'pending').length;
  const approvedCount = affiliates.filter((a) => a.status === 'approved').length;
  const rejectedCount = affiliates.filter((a) => a.status === 'rejected' || a.status === 'suspended').length;
  const totalEarnings = affiliates.reduce((sum, a) => sum + Number(a.total_earnings || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Parceiros</span>
          </div>
          <h2 className="mt-1.5 text-white text-2xl font-light tracking-tight">Afiliados</h2>
          <p className="mt-1 text-[12px] text-white/45">
            Gerencie afiliados e comissões. Validação automática verifica registros em 90 dias. * = comissão personalizada.
          </p>
        </div>
        <Button
          onClick={handleValidateCommissions}
          disabled={isValidatingCommissions}
          size="sm"
          className="h-9 gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08]"
        >
          {isValidatingCommissions ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Validar Comissões (90 dias)
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          kicker="Total"
          value={affiliates.length}
          hint="Afiliados cadastrados"
          icon={Users}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_55%)]"
          dot="bg-sky-400"
        />
        <StatTile
          kicker="Pendentes"
          value={pendingCount}
          hint="Aguardando análise"
          icon={TrendingUp}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_55%)]"
          dot="bg-amber-400"
        />
        <StatTile
          kicker="Aprovados"
          value={approvedCount}
          hint="Ativos na plataforma"
          icon={Check}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_55%)]"
          dot="bg-emerald-400"
        />
        <StatTile
          kicker="Ganhos totais"
          value={`R$ ${totalEarnings.toFixed(0)}`}
          hint="Somatório da rede"
          icon={Percent}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_55%)]"
          dot="bg-violet-400"
        />
      </div>

      {/* Filters */}
      <Panel className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-3.5 w-3.5 text-white/45" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Filtros</span>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <Input
              placeholder="Nome, email ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30 text-[13px]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-white/[0.03] border border-white/[0.06] text-white text-[13px] min-w-[160px]"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>
      </Panel>

      {/* Table */}
      <Panel>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Listagem</span>
            <span className="text-[11px] text-white/40 ml-1">
              {filteredAffiliates.length} {filteredAffiliates.length === 1 ? 'afiliado' : 'afiliados'}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-white/[0.05] hover:bg-transparent">
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40">Nome</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40">Email</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40">WhatsApp</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40">Status</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40">Nível</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40">Comissão</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40 text-right">Registros</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40 text-right">Ganhos</TableHead>
                <TableHead className="h-9 text-[10px] uppercase tracking-[0.14em] text-white/40 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAffiliates.map((affiliate) => (
                <TableRow
                  key={affiliate.id}
                  className="border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="text-[13px] text-white font-medium">{affiliate.full_name}</TableCell>
                  <TableCell className="text-[12px] text-white/60">{affiliate.contact_email}</TableCell>
                  <TableCell className="text-[12px] text-white/60">{affiliate.whatsapp}</TableCell>
                  <TableCell><StatusPill status={affiliate.status} /></TableCell>
                  <TableCell><LevelPill level={affiliate.level} /></TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full ring-1 tabular-nums ${
                        affiliate.custom_commission_rate
                          ? 'bg-violet-400/10 text-violet-300 ring-violet-400/20'
                          : 'bg-white/[0.04] text-white/70 ring-white/10'
                      }`}
                    >
                      {getCommissionRate(affiliate)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/80 text-right tabular-nums">
                    {affiliate.total_registrations}
                  </TableCell>
                  <TableCell className="text-[13px] text-emerald-300/90 text-right tabular-nums">
                    R$ {Number(affiliate.total_earnings || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <ImpersonateButton
                        targetUser={{
                          id: affiliate.user_id,
                          email: affiliate.contact_email || '',
                          name: affiliate.full_name || '',
                          artistic_name: null,
                        }}
                        targetRole="user"
                        variant="outline"
                        size="sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/[0.06]"
                        onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setShowDetailsModal(true);
                        }}
                        title="Ver detalhes"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/[0.06]"
                        onClick={() => {
                          setSelectedAffiliateForReferrals({ id: affiliate.id, name: affiliate.full_name });
                          setIsReferralsModalOpen(true);
                        }}
                        title="Ver usuários indicados"
                      >
                        <Users className="h-3.5 w-3.5" />
                      </Button>
                      {affiliate.status === 'pending' && (
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-300 ring-1 ring-emerald-400/25"
                          onClick={() => handleApprove(affiliate)}
                          disabled={processingAction}
                          title="Aprovar"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAffiliates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-white/40 text-[12px] py-8">
                    Nenhum afiliado encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-white/[0.06] bg-[#0c0c0e]">
          <div className="relative p-5 border-b border-white/[0.05] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_55%)]" />
            <DialogHeader className="relative space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Parceiro</span>
              </div>
              <DialogTitle className="text-white text-xl font-light tracking-tight">
                Detalhes do Afiliado
              </DialogTitle>
              <DialogDescription className="text-white/45 text-[12px]">
                Informações completas da solicitação
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedAffiliate && (
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Nome</p>
                  <p className="text-[13px] text-white mt-1">{selectedAffiliate.full_name}</p>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Email</p>
                  <p className="text-[13px] text-white mt-1 truncate">{selectedAffiliate.contact_email}</p>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">WhatsApp</p>
                  <p className="text-[13px] text-white mt-1">{selectedAffiliate.whatsapp}</p>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Código</p>
                  <p className="text-[13px] text-white mt-1 font-mono">{selectedAffiliate.affiliate_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Status</p>
                  <div className="mt-2"><StatusPill status={selectedAffiliate.status} /></div>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Nível</p>
                  <div className="mt-2"><LevelPill level={selectedAffiliate.level} /></div>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Comissão</p>
                  <p className="mt-2 text-[13px] text-white tabular-nums">
                    {getCommissionRate(selectedAffiliate)}
                  </p>
                  {selectedAffiliate.custom_commission_rate && (
                    <p className="text-[10px] text-violet-300/80 mt-0.5">Personalizada</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.025] p-4 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Registros</p>
                  <p className="mt-1 text-2xl font-light text-white tabular-nums">
                    {selectedAffiliate.total_registrations}
                  </p>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-4 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Ganhos</p>
                  <p className="mt-1 text-2xl font-light text-emerald-300 tabular-nums">
                    R$ {Number(selectedAffiliate.total_earnings || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {(selectedAffiliate.social_media_link ||
                selectedAffiliate.youtube_link ||
                selectedAffiliate.tiktok_link ||
                selectedAffiliate.website_link) && (
                <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 mb-2">Redes sociais</p>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    {selectedAffiliate.social_media_link && (
                      <a href={selectedAffiliate.social_media_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-white/70 hover:text-white">
                        <ExternalLink className="h-3 w-3" /> Instagram/Facebook
                      </a>
                    )}
                    {selectedAffiliate.youtube_link && (
                      <a href={selectedAffiliate.youtube_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-white/70 hover:text-white">
                        <ExternalLink className="h-3 w-3" /> YouTube
                      </a>
                    )}
                    {selectedAffiliate.tiktok_link && (
                      <a href={selectedAffiliate.tiktok_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-white/70 hover:text-white">
                        <ExternalLink className="h-3 w-3" /> TikTok
                      </a>
                    )}
                    {selectedAffiliate.website_link && (
                      <a href={selectedAffiliate.website_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-white/70 hover:text-white">
                        <ExternalLink className="h-3 w-3" /> Site
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 mb-1.5">Estratégia de promoção</p>
                <p className="text-[12px] text-white/75 leading-relaxed">{selectedAffiliate.promotion_strategy}</p>
              </div>

              {selectedAffiliate.rejection_reason && (
                <div className="rounded-xl bg-red-400/[0.06] p-3 ring-1 ring-red-400/20">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-red-300/80 mb-1.5">Motivo da rejeição</p>
                  <p className="text-[12px] text-red-200/90">{selectedAffiliate.rejection_reason}</p>
                </div>
              )}

              {selectedAffiliate.status === 'pending' && (
                <div className="space-y-3 pt-3 border-t border-white/[0.05]">
                  <div>
                    <Label className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                      Motivo da reprovação (se aplicável)
                    </Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Informe o motivo da reprovação..."
                      rows={3}
                      className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white text-[13px] placeholder:text-white/30"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(selectedAffiliate)}
                      disabled={processingAction}
                      className="flex-1 h-9 bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-200 ring-1 ring-emerald-400/25"
                    >
                      <Check className="h-4 w-4 mr-2" /> Aprovar
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedAffiliate)}
                      disabled={processingAction || !rejectionReason.trim()}
                      className="flex-1 h-9 bg-red-400/15 hover:bg-red-400/25 text-red-200 ring-1 ring-red-400/25"
                    >
                      <X className="h-4 w-4 mr-2" /> Rejeitar
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
