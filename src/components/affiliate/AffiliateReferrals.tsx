import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAffiliate } from '@/hooks/useAffiliate';
import { Calendar, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  expiration_date: string;
  days_remaining: number;
  has_registered_work: boolean;
  commission_status: 'confirmed' | 'waiting' | 'expired';
  total_works: number;
}

export function AffiliateReferrals() {
  const { affiliate } = useAffiliate();
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<ReferredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'waiting' | 'expired'>('all');
  const [expirationFilter, setExpirationFilter] = useState<'all' | 'expiring_soon' | 'expired'>('all');

  useEffect(() => {
    if (affiliate?.affiliate_code) {
      loadReferrals();
    }
  }, [affiliate?.affiliate_code]);

  useEffect(() => {
    applyFilters();
  }, [referrals, searchTerm, statusFilter, expirationFilter]);

  const loadReferrals = async () => {
    try {
      setIsLoading(true);

      // Buscar usuários indicados pelo código do afiliado
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, moderator_notes')
        .ilike('moderator_notes', `%${affiliate.affiliate_code}%`);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        setReferrals([]);
        return;
      }

      const userIds = profiles.map(p => p.id);

      // Buscar registros de obras dos indicados
      const { data: registrations } = await supabase
        .from('author_registrations')
        .select('user_id, status')
        .in('user_id', userIds)
        .in('status', ['registered', 'completed']);

      // Processar dados
      const processedReferrals: ReferredUser[] = profiles.map(profile => {
        const userRegistrations = registrations?.filter(r => r.user_id === profile.id) || [];
        const hasRegisteredWork = userRegistrations.length > 0;
        const createdAt = new Date(profile.created_at);
        const expirationDate = addDays(createdAt, 90);
        const daysRemaining = differenceInDays(expirationDate, new Date());
        const isExpired = daysRemaining < 0;

        let commissionStatus: 'confirmed' | 'waiting' | 'expired' = 'waiting';
        if (hasRegisteredWork) {
          commissionStatus = 'confirmed';
        } else if (isExpired) {
          commissionStatus = 'expired';
        }

        return {
          id: profile.id,
          name: profile.name || 'Sem nome',
          email: profile.email || '',
          created_at: profile.created_at,
          expiration_date: expirationDate.toISOString(),
          days_remaining: Math.max(0, daysRemaining),
          has_registered_work: hasRegisteredWork,
          commission_status: commissionStatus,
          total_works: userRegistrations.length,
        };
      });

      setReferrals(processedReferrals);
    } catch (error) {
      console.error('Erro ao carregar indicados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...referrals];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.commission_status === statusFilter);
    }

    // Filtro de expiração
    if (expirationFilter === 'expiring_soon') {
      filtered = filtered.filter(r => r.days_remaining <= 30 && r.days_remaining > 0);
    } else if (expirationFilter === 'expired') {
      filtered = filtered.filter(r => r.days_remaining === 0 && !r.has_registered_work);
    }

    setFilteredReferrals(filtered);
  };

  const getStatusBadge = (status: 'confirmed' | 'waiting' | 'expired') => {
    const variants = {
      confirmed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: 'Confirmada' },
      waiting: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock, label: 'Aguardando' },
      expired: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle, label: 'Expirada' }
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    );
  };

  const getExpirationBadge = (daysRemaining: number, hasWork: boolean) => {
    if (hasWork) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Confirmado</Badge>;
    }
    
    if (daysRemaining === 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    if (daysRemaining <= 10) {
      return <Badge variant="destructive">{daysRemaining} dias restantes</Badge>;
    }
    
    if (daysRemaining <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">{daysRemaining} dias restantes</Badge>;
    }
    
    return <Badge variant="outline">{daysRemaining} dias restantes</Badge>;
  };

  const stats = {
    total: referrals.length,
    confirmed: referrals.filter(r => r.commission_status === 'confirmed').length,
    waiting: referrals.filter(r => r.commission_status === 'waiting').length,
    expired: referrals.filter(r => r.commission_status === 'expired').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 dark:text-green-300">Confirmadas</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">Aguardando</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.waiting}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800 dark:text-red-300">Expiradas</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.expired}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Indicados</CardTitle>
          <CardDescription>
            Gerencie e acompanhe todos os seus indicados. Comissões são confirmadas quando o usuário registra uma obra em até 90 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status da Comissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={expirationFilter} onValueChange={(v: any) => setExpirationFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Prazo de Expiração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Prazos</SelectItem>
                <SelectItem value="expiring_soon">Expirando em breve (≤30 dias)</SelectItem>
                <SelectItem value="expired">Já expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Obras Registradas</TableHead>
                  <TableHead>Status da Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum indicado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{referral.name}</TableCell>
                      <TableCell>{referral.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(referral.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getExpirationBadge(referral.days_remaining, referral.has_registered_work)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={referral.total_works > 0 ? "default" : "secondary"}>
                          {referral.total_works} {referral.total_works === 1 ? 'obra' : 'obras'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(referral.commission_status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
