import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackAffiliateClick } from '@/services/affiliateService';
import { Loader2 } from 'lucide-react';

export default function AffiliateLink() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAffiliateRedirect = async () => {
      if (!code) {
        navigate('/');
        return;
      }

      try {
        // Reconstituir código completo do afiliado
        // O código curto vem como "-74dfb4150e1a-fabricionedinodasilva"
        // Precisamos reconstruir como "compuse-[uuid-completo]-fabricionedinodasilva"
        // Como não temos a primeira parte do UUID, vamos buscar no banco
        const fullCode = `compuse${code}`;
        
        console.log('Código recebido:', code);
        console.log('Código completo:', fullCode);
        
        // Extrair UTM parameters da URL se existirem
        const searchParams = new URLSearchParams(window.location.search);
        const utmParams: Record<string, string> = {};
        
        if (searchParams.has('utm_source')) utmParams.utm_source = searchParams.get('utm_source')!;
        if (searchParams.has('utm_medium')) utmParams.utm_medium = searchParams.get('utm_medium')!;
        if (searchParams.has('utm_campaign')) utmParams.utm_campaign = searchParams.get('utm_campaign')!;
        if (searchParams.has('utm_content')) utmParams.utm_content = searchParams.get('utm_content')!;

        // Registrar o clique do afiliado com o código completo
        await trackAffiliateClick(fullCode, Object.keys(utmParams).length > 0 ? utmParams : undefined);
        
        console.log('Clique rastreado com sucesso, redirecionando para registro autoral...');
        
        // Redirecionar direto para a página de registro autoral
        setTimeout(() => {
          navigate('/author-registration');
        }, 500);
      } catch (error) {
        console.error('Erro ao processar link de afiliado:', error);
        navigate('/');
      }
    };

    handleAffiliateRedirect();
  }, [code, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Processando seu convite...</p>
      </div>
    </div>
  );
}