import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackAffiliateClick } from '@/services/affiliateService';
import { Loader2 } from 'lucide-react';

export default function AffiliateLink() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const processAffiliateLink = async () => {
      if (!code) {
        window.location.replace('/');
        return;
      }

      // Reconstruir código completo: compuse-{uuid-nome}
      const fullCode = `compuse-${code}`;
      
      console.log('🔗 Processando link de afiliado:', {
        codeFromUrl: code,
        fullCode: fullCode
      });
      
      // Extrair UTM parameters da URL se existirem
      const searchParams = new URLSearchParams(window.location.search);
      const utmParams: Record<string, string> = {};
      
      if (searchParams.has('utm_source')) utmParams.utm_source = searchParams.get('utm_source')!;
      if (searchParams.has('utm_medium')) utmParams.utm_medium = searchParams.get('utm_medium')!;
      if (searchParams.has('utm_campaign')) utmParams.utm_campaign = searchParams.get('utm_campaign')!;
      if (searchParams.has('utm_content')) utmParams.utm_content = searchParams.get('utm_content')!;

      // IMPORTANTE: Registrar o clique ANTES de redirecionar
      try {
        await trackAffiliateClick(fullCode, Object.keys(utmParams).length > 0 ? utmParams : undefined);
        console.log('✅ Clique registrado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao rastrear clique:', error);
      }
      
      // Redirecionar APENAS APÓS registrar o clique
      window.location.replace(`/?ref=${fullCode}`);
    };

    processAffiliateLink();
  }, [code]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Processando seu convite...</p>
      </div>
    </div>
  );
}