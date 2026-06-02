import React, { useState, useEffect, useRef } from 'react';
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
import { getDraftById } from '@/services/drafts/draftService';
import { toast } from 'sonner';
import { LoadFromFormButton } from '@/components/author-registration/LoadFromFormButton';

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
  registrationType: 'lyrics_only' | 'complete' | 'melody_only';
}

// Interface para dados do Step 1 mobile
interface MobileStep1Data {
  title: string;
  authors: Array<{ id: string; name: string; initials: string; percentage: number | null; isTitular: boolean; cpf?: string; avatarUrl?: string; isFromPlatform?: boolean; }>;
  hasSamples: boolean;
}

// Interface para dados do Step 2 mobile
interface MobileStep2Data {
  registrationType: 'lyrics_only' | 'complete' | 'melody_only';
  genre: string;
  version: string;
  lyrics: string;
  audioFile: File | null;
  additionalInfo: string;
}

const STORAGE_KEY = 'author_registration_draft';

// Função para salvar dados no sessionStorage
const saveToStorage = (data: {
  formData: AuthorRegistrationData;
  step: 'form' | 'review';
  desktopStep: 1 | 2;
  mobileStep: 1 | 2 | 3;
  mobileStep1Data: MobileStep1Data | null;
  mobileStep2Data: MobileStep2Data | null;
}) => {
  try {
    // Não salvar o audioFile pois não é serializável
    const dataToSave = {
      ...data,
      formData: { ...data.formData, audioFile: null },
      mobileStep2Data: data.mobileStep2Data ? { ...data.mobileStep2Data, audioFile: null } : null,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Erro ao salvar dados no storage:', e);
  }
};

// Função para carregar dados do sessionStorage
const loadFromStorage = (): {
  formData: AuthorRegistrationData;
  step: 'form' | 'review';
  desktopStep: 1 | 2;
  mobileStep: 1 | 2 | 3;
  mobileStep1Data: MobileStep1Data | null;
  mobileStep2Data: MobileStep2Data | null;
} | null => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar dados do storage:', e);
  }
  return null;
};

// Função para limpar dados do sessionStorage (incluindo steps mobile)
const clearStorage = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('mobile_registration_step1_draft');
    sessionStorage.removeItem('mobile_registration_step2_draft');
  } catch (e) {
    console.error('Erro ao limpar storage:', e);
  }
};

const AuthorRegistration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { isMobile } = useMobileDetection();
  const { isComplete: isProfileComplete } = useProfileValidation();
  const { profile } = useProfile();

  // Refs para estabilizar créditos e evitar remontagem do formulário
  const creditsRef = useRef<number | null>(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!creditsLoading && credits !== null) {
      creditsRef.current = credits;
      hasLoadedOnce.current = true;
    }
  }, [credits, creditsLoading]);

  const effectiveCredits = credits ?? creditsRef.current;
  const showLoading = creditsLoading && !hasLoadedOnce.current;
  const hasNoCredits = !showLoading && (effectiveCredits === null || effectiveCredits === 0);
  
  // Carregar dados salvos do storage
  const savedData = loadFromStorage();

  const [step, setStep] = useState<'form' | 'review'>(savedData?.step || 'form');
  const [desktopStep, setDesktopStep] = useState<1 | 2>(savedData?.desktopStep || 1);
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(savedData?.mobileStep || 1);
  const [mobileStep1Data, setMobileStep1Data] = useState<MobileStep1Data | null>(savedData?.mobileStep1Data || null);
  const [mobileStep2Data, setMobileStep2Data] = useState<MobileStep2Data | null>(savedData?.mobileStep2Data || null);
  const [formData, setFormData] = useState<AuthorRegistrationData>(savedData?.formData || {
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

  // Salvar dados sempre que houver mudanças
  useEffect(() => {
    saveToStorage({
      formData,
      step,
      desktopStep,
      mobileStep,
      mobileStep1Data,
      mobileStep2Data,
    });
  }, [formData, step, desktopStep, mobileStep, mobileStep1Data, mobileStep2Data]);

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

  // Pré-preencher formulário a partir de um rascunho (?draftId=...)
  const [draftPrefillApplied, setDraftPrefillApplied] = useState(false);
  const [prefilledFromDraft, setPrefilledFromDraft] = useState<{ title: boolean; lyrics: boolean; audio: boolean }>({
    title: false,
    lyrics: false,
    audio: false,
  });

  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (!draftId || draftPrefillApplied) return;

    let cancelled = false;
    (async () => {
      try {
        const draft = await getDraftById(draftId);
        if (!draft || cancelled) return;

        // Tenta baixar o primeiro áudio do rascunho e converter para File
        let audioFile: File | null = null;
        const firstAudio = draft.audio_files?.[0]?.url || draft.audio_url;
        const firstAudioName = draft.audio_files?.[0]?.name || 'rascunho-audio.mp3';
        if (firstAudio) {
          try {
            const res = await fetch(firstAudio);
            if (res.ok) {
              const blob = await res.blob();
              const type = blob.type || 'audio/mpeg';
              audioFile = new File([blob], firstAudioName, { type });
            }
          } catch (err) {
            console.warn('Não foi possível carregar áudio do rascunho:', err);
          }
        }

        if (cancelled) return;

        // Limpa storage para evitar conflito com dados antigos
        try {
          sessionStorage.removeItem('author_registration_draft');
          sessionStorage.removeItem('mobile_registration_step1_draft');
          sessionStorage.removeItem('mobile_registration_step2_draft');
        } catch {}

        setFormData((prev) => ({
          ...prev,
          title: draft.title || prev.title,
          lyrics: draft.content || prev.lyrics,
          audioFile: audioFile || prev.audioFile,
        }));

        setMobileStep1Data({
          title: draft.title || '',
          authors: [
            {
              id: 'titular',
              name: profile?.name || 'Você',
              initials: (profile?.name || 'VC').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
              percentage: 100,
              isTitular: true,
            },
          ],
          hasSamples: false,
        });

        setMobileStep2Data({
          registrationType: audioFile ? 'complete' : 'lyrics_only',
          genre: '',
          version: '',
          lyrics: draft.content || '',
          audioFile,
          additionalInfo: '',
        });

        setPrefilledFromDraft({
          title: !!draft.title,
          lyrics: !!draft.content,
          audio: !!audioFile,
        });
        setDraftPrefillApplied(true);

        toast.success('Dados do rascunho carregados — revise antes de continuar.');

        // Remove o param da URL para evitar reaplicar em remontagem
        const next = new URLSearchParams(searchParams);
        next.delete('draftId');
        const qs = next.toString();
        navigate(`${window.location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
      } catch (err) {
        console.error('Erro ao pré-preencher a partir do rascunho:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, draftPrefillApplied, profile, navigate]);

  // Pré-preencher formulário a partir de uma obra pendente do formulário (?formWorkId=...)
  const [formPrefillApplied, setFormPrefillApplied] = useState(false);
  useEffect(() => {
    const formWorkId = searchParams.get('formWorkId');
    if (!formWorkId || formPrefillApplied) return;

    let cancelled = false;
    (async () => {
      try {
        const { data: work, error } = await supabase
          .from('author_registrations')
          .select('id, title, lyrics, audio_file_path, genre, song_version, additional_info')
          .eq('id', formWorkId)
          .maybeSingle();
        if (error || !work || cancelled) return;

        let audioFile: File | null = null;
        if (work.audio_file_path) {
          try {
            const { data: pub } = supabase.storage
              .from('author-registrations')
              .getPublicUrl(work.audio_file_path);
            const res = await fetch(pub.publicUrl);
            if (res.ok) {
              const blob = await res.blob();
              const type = blob.type || 'audio/mpeg';
              const name = work.audio_file_path.split('/').pop() || 'formulario-audio.mp3';
              audioFile = new File([blob], name, { type });
            }
          } catch (err) {
            console.warn('Não foi possível carregar áudio do formulário:', err);
          }
        }

        if (cancelled) return;

        try {
          sessionStorage.removeItem('author_registration_draft');
          sessionStorage.removeItem('mobile_registration_step1_draft');
          sessionStorage.removeItem('mobile_registration_step2_draft');
        } catch {}

        setFormData((prev) => ({
          ...prev,
          title: work.title || prev.title,
          lyrics: work.lyrics || prev.lyrics,
          genre: work.genre || prev.genre,
          song_version: work.song_version || prev.song_version,
          additional_info: work.additional_info || prev.additional_info,
          audioFile: audioFile || prev.audioFile,
        }));

        setMobileStep1Data({
          title: work.title || '',
          authors: [
            {
              id: 'titular',
              name: profile?.name || 'Você',
              initials: (profile?.name || 'VC').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
              percentage: 100,
              isTitular: true,
            },
          ],
          hasSamples: false,
        });

        setMobileStep2Data({
          registrationType: audioFile ? 'complete' : 'lyrics_only',
          genre: work.genre || '',
          version: work.song_version || '',
          lyrics: work.lyrics || '',
          audioFile,
          additionalInfo: work.additional_info || '',
        });

        setPrefilledFromDraft({
          title: !!work.title,
          lyrics: !!work.lyrics,
          audio: !!audioFile,
        });
        setFormPrefillApplied(true);

        toast.success('Dados do formulário carregados — revise antes de continuar.');

        const next = new URLSearchParams(searchParams);
        next.delete('formWorkId');
        const qs = next.toString();
        navigate(`${window.location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
      } catch (err) {
        console.error('Erro ao pré-preencher do formulário:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, formPrefillApplied, profile, navigate]);



  if (showLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Log para debug
  console.log('💳 Estado dos créditos:', { credits, effectiveCredits, creditsLoading, currentUser: user?.id });

  // Remove the blocking credit check at the start
  // The credit check will now happen only at the final confirmation step


  const handleFormSubmit = (data: AuthorRegistrationData) => {
    setFormData(data);
    setStep('review');
  };

  const handleFormChange = (partialData: Partial<AuthorRegistrationData>) => {
    setFormData(prev => ({ ...prev, ...partialData }));
  };

  const handleRegisterComplete = () => {
    // Limpar o storage ao completar o registro
    clearStorage();
    
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
    setDesktopStep(1);
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
        key={draftPrefillApplied ? 'prefilled' : 'fresh'}
        onContinue={handleMobileStep1Continue}
        initialData={mobileStep1Data || undefined}
      />
    );
  }

  // Renderização Mobile - Step 2
  if (isMobile && isProfileComplete && mobileStep === 2) {
    return (
      <MobileRegistrationStep2
        key={draftPrefillApplied ? 'prefilled' : 'fresh'}
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
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              Registro Autoral
            </h1>
            {!isMobile && isProfileComplete && step === 'form' && (
              <LoadFromFormButton variant="desktop" />
            )}
          </div>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
            Registre suas músicas e proteja seus direitos autorais
          </p>
          {(prefilledFromDraft.title || prefilledFromDraft.lyrics || prefilledFromDraft.audio) && step === 'form' && (
            <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 text-primary px-3 py-2 text-sm flex items-start gap-2">
              <Gift className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>Dados carregados do rascunho:</strong>{' '}
                {[
                  prefilledFromDraft.title && 'título',
                  prefilledFromDraft.lyrics && 'letra',
                  prefilledFromDraft.audio && 'áudio',
                ]
                  .filter(Boolean)
                  .join(', ')}
                . Você pode editar livremente antes de finalizar.
              </span>
            </div>
          )}
        </div>

        <ProfileCompletionCheck />

        {step === 'form' && isProfileComplete && (
          <AuthorRegistrationSteps
            initialData={formData}
            onSubmit={handleFormSubmit}
            userCredits={effectiveCredits}
            initialStep={desktopStep}
            onStepChange={setDesktopStep}
            onChange={handleFormChange}
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