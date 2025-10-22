import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getMyAffiliateData, 
  getAffiliateStats, 
  getAffiliateCommissions, 
  getAffiliateCampaigns,
  type Affiliate, 
  type AffiliateStats, 
  type AffiliateCommission, 
  type AffiliateCampaign 
} from '@/services/affiliateService';

export const useAffiliate = () => {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [campaigns, setCampaigns] = useState<AffiliateCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAffiliateData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [affiliateData, statsData, commissionsData, campaignsData] = await Promise.all([
        getMyAffiliateData(),
        getAffiliateStats(),
        getAffiliateCommissions(),
        getAffiliateCampaigns()
      ]);

      setAffiliate(affiliateData);
      setStats(statsData);
      setCommissions(commissionsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Erro ao carregar dados do afiliado:', err);
      setError('Erro ao carregar dados do afiliado');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadAffiliateData();
  };

  useEffect(() => {
    loadAffiliateData();
  }, []);

  // Listener realtime para novas comissões
  useEffect(() => {
    if (!affiliate?.id) return;
    
    console.log('📡 Configurando listener realtime para comissões do parceiro:', affiliate.id);
    
    const channel = supabase
      .channel(`affiliate-commissions-${affiliate.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'affiliate_commissions',
          filter: `affiliate_id=eq.${affiliate.id}`
        },
        (payload) => {
          console.log('💰 Nova comissão recebida em tempo real!', payload);
          refreshData(); // Recarregar todos os dados
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal realtime:', status);
      });
    
    return () => {
      console.log('🔌 Desconectando listener realtime');
      supabase.removeChannel(channel);
    };
  }, [affiliate?.id]);

  const isAffiliate = affiliate?.status === 'approved';
  const isPending = affiliate?.status === 'pending';
  const isRejected = affiliate?.status === 'rejected';

  return {
    affiliate,
    stats,
    commissions,
    campaigns,
    isLoading,
    error,
    isAffiliate,
    isPending,
    isRejected,
    refreshData
  };
};