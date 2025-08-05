import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { AuthorRegistrationSteps } from '@/components/author-registration/AuthorRegistrationSteps';
import { AuthorRegistrationReview } from '@/components/author-registration/AuthorRegistrationReview';
import { ProfileCompletionCheck } from '@/components/author-registration/ProfileCompletionCheck';
import { useUserCredits } from '@/hooks/useUserCredits';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { useMobileDetection } from '@/hooks/use-mobile';

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
}

const AuthorRegistration: React.FC = () => {
  const { user } = useAuth();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isMobile } = useMobileDetection();
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
  });

  if (creditsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              <Button size={isMobile ? "default" : "lg"} className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Adicionar Créditos via Pix
              </Button>
              <p className="text-xs md:text-sm text-muted-foreground">
                Entre em contato conosco para adicionar créditos à sua conta
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

        <ProfileCompletionCheck 
          onContinue={() => setStep('form')} 
        />

        {step === 'form' && (
          <AuthorRegistrationSteps 
            initialData={formData}
            onSubmit={handleFormSubmit}
            userCredits={credits}
          />
        )}

        {step === 'review' && (
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