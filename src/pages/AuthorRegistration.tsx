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
import { MobileRegistrationStep1 } from '@/components/author-registration/MobileRegistrationStep1';
import { MobileRegistrationStep2 } from '@/components/author-registration/MobileRegistrationStep2';
import { MobileRegistrationStep3 } from '@/components/author-registration/MobileRegistrationStep3';
import { useProfile } from '@/hooks/useProfile';

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

// Interface para dados do Step 1 mobile
interface MobileStep1Data {
  title: string;
  authors: Array<{ id: string; name: string; initials: string; percentage: number | null; isTitular: boolean; cpf?: string; avatarUrl?: string; isFromPlatform?: boolean; }>;
  hasSamples: boolean;
}

// Interface para dados do Step 2 mobile
interface MobileStep2Data {
  registrationType: 'lyrics_only' | 'complete';
  genre: string;
  version: string;
  lyrics: string;
  audioFile: File | null;
  additionalInfo: string;
}

const AuthorRegistration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isMobile } = useMobileDetection();
  const { isComplete: isProfileComplete } = useProfileValidation();
  const { profile } = useProfile();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const [mobileStep1Data, setMobileStep1Data] = useState<MobileStep1Data | null>(null);
  const [mobileStep2Data, setMobileStep2Data] = useState<MobileStep2Data | null>(null);
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
    setMobileStep(1);
    setMobileStep1Data(null);
    setMobileStep2Data(null);
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  // Handler para o Step 1 mobile
  const handleMobileStep1Continue = (data: MobileStep1Data) => {
    setMobileStep1Data(data);

    const titularFromStep = data.authors.find((a) => a.isTitular);
    const authorName = profile?.name || titularFromStep?.name || '';
    const authorCpf = profile?.cpf || '';

    // Atualizar formData com os dados do step 1
    const otherAuthors = data.authors
      .filter((a) => !a.isTitular)
      .map((a) => ({ name: a.name, cpf: a.cpf || '' }));

    setFormData((prev) => ({
      ...prev,
      title: data.title,
      author: authorName,
      authorCpf,
      hasOtherAuthors: otherAuthors.length > 0,
      otherAuthors,
    }));

    setMobileStep(2);
    console.log('Step 1 completed:', data);
  };

  // Handler para o Step 2 mobile
  const handleMobileStep2Continue = (data: MobileStep2Data) => {
    setMobileStep2Data(data);

    // Atualizar formData com os dados do step 2
    setFormData((prev) => ({
      ...prev,
      genre: data.genre,
      styleVariation: data.version,
      songVersion: data.version,
      lyrics: data.lyrics,
      audioFile: data.audioFile,
      additionalInfo: data.additionalInfo,
      registrationType: data.registrationType,
      termsAccepted: false,
    }));

    setMobileStep(3);
    console.log('Step 2 completed:', data);
  };

  // Handler para voltar ao Step 1 mobile
  const handleMobileStep2Back = () => {
    setMobileStep(1);
  };

  // Handler para voltar ao Step 2 mobile
  const handleMobileStep3Back = () => {
    setMobileStep(2);
  };

  // Renderização Mobile - Step 1
  if (isMobile && isProfileComplete && mobileStep === 1) {
    return (
      <MobileRegistrationStep1
        onContinue={handleMobileStep1Continue}
        initialData={mobileStep1Data || undefined}
      />
    );
  }

  // Renderização Mobile - Step 2
  if (isMobile && isProfileComplete && mobileStep === 2) {
    return (
      <MobileRegistrationStep2
        onContinue={handleMobileStep2Continue}
        onBack={handleMobileStep2Back}
        initialData={mobileStep2Data || undefined}
      />
    );
  }

  // Renderização Mobile - Step 3
  if (isMobile && isProfileComplete && mobileStep === 3) {
    return (
      <MobileRegistrationStep3
        onConfirm={handleRegisterComplete}
        onBack={handleMobileStep3Back}
        formData={formData}
        authors={mobileStep1Data?.authors || []}
      />
    );
  }

  // Renderização Desktop (mantém o comportamento original)
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