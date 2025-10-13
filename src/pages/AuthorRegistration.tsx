import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft, Gift } from 'lucide-react';
import { AuthorRegistrationSteps } from '@/components/author-registration/AuthorRegistrationSteps';
import { AuthorRegistrationReview } from '@/components/author-registration/AuthorRegistrationReview';
import { ProfileCompletionCheck } from '@/components/author-registration/ProfileCompletionCheck';
import { useUserCredits } from '@/hooks/useUserCredits';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useProfileValidation } from '@/hooks/useProfileValidation';
import { trackAffiliateClick } from '@/services/affiliateService';

export interface AuthorRegistrationData {
  title: string;
  author: string;
  authorCpf: string;
  hasOtherAuthors: boolean;
  otherAuthors: Array<{ name: string; cpf: string; }>;
  genre: string;
  styleVariation: string;
  songVersion?: string;
  lyrics: string;
  audioFile: File | null;
  additionalInfo: string;
  termsAccepted: boolean;
  registrationType: 'lyrics_only' | 'complete';
}

const AuthorRegistration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isMobile } = useMobileDetection();
  const { isComplete: isProfileComplete } = useProfileValidation();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [formData, setFormData] = useState<AuthorRegistrationData>({
    title: '',
    author: '',
    authorCpf: '',
    hasOtherAuthors: false,
    otherAuthors: [],
    genre: '',
    styleVariation: '',
    songVersion: '',
    lyrics: '',
    audioFile: null,
    additionalInfo: '',
    termsAccepted: false,
    registrationType: 'complete',
  });

  // Capturar código de afiliado da URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      console.log('🔗 Link de afiliado detectado:', refCode);
      
      // Capturar UTM params da URL
      const utmParams = {
        utm_source: searchParams.get('utm_source') || undefined,
        utm_medium: searchParams.get('utm_medium') || undefined,
        utm_campaign: searchParams.get('utm_campaign') || undefined,
        utm_content: searchParams.get('utm_content') || undefined,
      };
      
      // Registrar clique do afiliado
      trackAffiliateClick(refCode, utmParams)
        .then(() => console.log('✅ Clique de afiliado registrado'))
        .catch((err) => console.error('❌ Erro ao registrar clique:', err));
    }
  }, [searchParams]);

  if (creditsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Log para debug
  console.log('💳 Estado dos créditos:', { credits, creditsLoading, currentUser: user?.id });

  if (credits === null || credits === 0) {
    return (
      <ResponsiveContainer
        mobileClassName="px-4 py-2"
        desktopClassName="container mx-auto px-4 py-8"
      >
        <Card className={isMobile ? "mx-auto" : "max-w-2xl mx-auto"}>
          <CardHeader className="text-center">
            <CardTitle className={`flex items-center justify-center gap-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              <CreditCard className="h-6 w-6" />
              Créditos necessários
            </CardTitle>
            <CardDescription>
              Você precisa ter créditos para registrar suas músicas
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-muted p-4 md:p-6 rounded-lg">
              <h3 className={`font-semibold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                Por que preciso de créditos?
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                O registro autoral protege seus direitos autorais. Cada registro consome 1 crédito.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Seus créditos atuais: <span className="font-semibold">{credits || 0}</span></p>
              </div>
            </div>

            {/* Ofertas Especiais */}
            <div className="space-y-3">
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Gift className="h-4 w-4" />
                    <span className="font-semibold">Oferta Especial!</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    5+ créditos = R$ 25,00 cada (ao invés de R$ 30,00)
                  </p>
                  <p className="text-xs text-orange-600 font-medium">
                    Economia de até R$ 25,00!
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Gift className="h-4 w-4" />
                    <span className="font-semibold">Super Oferta!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    10+ créditos = R$ 25,00 cada + 2 créditos GRÁTIS
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    Economia total: R$ 110,00!
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Button 
                size={isMobile ? "default" : "lg"} 
                className="w-full"
                onClick={() => navigate('/credits-checkout')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Adicionar Créditos via Pix
              </Button>
              <p className="text-xs md:text-sm text-muted-foreground">
                Escolha a quantidade ideal de créditos e pague com PIX de forma segura
              </p>
            </div>
          </CardContent>
        </Card>
      </ResponsiveContainer>
    );
  }

  const handleFormSubmit = (data: AuthorRegistrationData) => {
    setFormData(data);
    setStep('review');
  };

  const handleRegisterComplete = () => {
    // Limpar o formulário e voltar para o início
    setFormData({
      title: '',
      author: '',
      authorCpf: '',
      hasOtherAuthors: false,
      otherAuthors: [],
      genre: '',
      styleVariation: '',
      songVersion: '',
      lyrics: '',
      audioFile: null,
      additionalInfo: '',
      termsAccepted: false,
      registrationType: 'complete',
    });
    setStep('form');
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  return (
    <ResponsiveContainer
      mobileClassName="px-2 py-2"
      tabletClassName="px-4 py-4"
      desktopClassName="container mx-auto px-4 py-8"
    >
      <div className={isMobile ? "w-full" : "max-w-4xl mx-auto"}>
        <div className={isMobile ? "mb-4" : "mb-6"}>
          <h1 className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Registro Autoral
          </h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
            Registre suas músicas e proteja seus direitos autorais
          </p>
        </div>

        <ProfileCompletionCheck />

        {step === 'form' && isProfileComplete && (
          <AuthorRegistrationSteps 
            initialData={formData}
            onSubmit={handleFormSubmit}
            userCredits={credits}
          />
        )}

        {step === 'review' && isProfileComplete && (
          <div className="space-y-4 md:space-y-6">
            <Button 
              variant="outline" 
              onClick={handleBackToForm}
              className="mb-4"
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao formulário
            </Button>
            
            <AuthorRegistrationReview
              data={formData}
              onRegister={handleRegisterComplete}
            />
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
};

export default AuthorRegistration;