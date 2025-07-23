import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { AuthorRegistrationForm } from '@/components/author-registration/AuthorRegistrationForm';
import { AuthorRegistrationReview } from '@/components/author-registration/AuthorRegistrationReview';
import { useUserCredits } from '@/hooks/useUserCredits';

export interface AuthorRegistrationData {
  title: string;
  author: string;
  otherAuthors: string;
  genre: string;
  rhythm: string;
  songVersion: string;
  lyrics: string;
  audioFile: File | null;
  additionalInfo: string;
  termsAccepted: boolean;
}

const AuthorRegistration: React.FC = () => {
  const { user } = useAuth();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [formData, setFormData] = useState<AuthorRegistrationData>({
    title: '',
    author: '',
    otherAuthors: '',
    genre: '',
    rhythm: '',
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

  if (!credits || credits === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <CreditCard className="h-6 w-6" />
              Créditos necessários
            </CardTitle>
            <CardDescription>
              Você precisa ter créditos para registrar suas músicas autoralmente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Por que preciso de créditos?</h3>
              <p className="text-muted-foreground mb-4">
                O registro autoral é um serviço que garante a proteção dos seus direitos autorais.
                Cada registro consome 1 crédito.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Seus créditos atuais: <span className="font-semibold">{credits || 0}</span></p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button size="lg" className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Adicionar Créditos via Pix
              </Button>
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco para adicionar créditos à sua conta
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
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
      otherAuthors: '',
      genre: '',
      rhythm: '',
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Registro Autoral</h1>
          <p className="text-muted-foreground">
            Registre suas músicas e proteja seus direitos autorais
          </p>
        </div>

        {step === 'form' && (
          <AuthorRegistrationForm 
            initialData={formData}
            onSubmit={handleFormSubmit}
            userCredits={credits}
          />
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={handleBackToForm}
              className="mb-4"
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
    </div>
  );
};

export default AuthorRegistration;