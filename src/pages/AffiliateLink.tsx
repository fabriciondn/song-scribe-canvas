import { supabase } from '@/integrations/supabase/client';

export async function trackAffiliateClick(affiliateCode: string) {
  try {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('affiliate_code', affiliateCode)
      .eq('status', 'approved')
      .single();

    if (!affiliate) return;

    await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: affiliate.id,
        ip_address: '127.0.0.1', // Em produção, capturar IP real
        user_agent: navigator.userAgent,
        referrer: document.referrer
      });

    // Salvar código no localStorage para conversão posterior
    localStorage.setItem('affiliate_code', affiliateCode);
  } catch (error) {
    console.error('Erro ao registrar clique:', error);
  }
}

// Edge function para processar link de afiliado
export default function AffiliateLink() {
  // Componente que será usado na rota /ref/:code
  return null;
}