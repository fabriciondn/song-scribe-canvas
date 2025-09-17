import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useMobileDetection } from '@/hooks/use-mobile';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Upload, FileAudio, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { AuthorRegistrationData } from '@/pages/AuthorRegistration';
import { useProfile } from '@/hooks/useProfile';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormDescription } from '@/components/ui/form';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3'];

// Schema para a primeira etapa (dados dos autores)
const step1Schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  author: z.string().min(1, 'Autor é obrigatório'),
  authorCpf: z.string().min(11, 'CPF deve ter pelo menos 11 dígitos').max(14, 'CPF inválido'),
  hasOtherAuthors: z.boolean(),
  otherAuthors: z.array(z.object({
    name: z.string(),
    cpf: z.string(),
  })).default([]),
}).refine((data) => {
  if (data.hasOtherAuthors && (!data.otherAuthors || data.otherAuthors.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Quando há outros autores, pelo menos um deve ser adicionado',
  path: ['otherAuthors'],
});

// Schema para a segunda etapa (informações da obra)
const step2Schema = z.object({
  genre: z.string().min(1, 'Gênero é obrigatório'),
  styleVariation: z.string().optional(),
  songVersion: z.string().optional(),
  registrationType: z.enum(['lyrics_only', 'complete'], {
    required_error: 'Selecione o tipo de registro',
  }),
  additionalInfo: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos para continuar',
  }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface AuthorRegistrationStepsProps {
  initialData: AuthorRegistrationData;
  onSubmit: (data: AuthorRegistrationData) => void;
  userCredits: number;
}

export const AuthorRegistrationSteps: React.FC<AuthorRegistrationStepsProps> = ({
  initialData,
  onSubmit,
  userCredits,
}) => {
  const { isMobile } = useMobileDetection();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({
    title: initialData.title,
    author: initialData.author,
    authorCpf: initialData.authorCpf,
    hasOtherAuthors: initialData.hasOtherAuthors,
    otherAuthors: initialData.otherAuthors,
  });
  const [audioFile, setAudioFile] = useState<File | null>(initialData.audioFile);
  const [audioError, setAudioError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [lyrics, setLyrics] = useState<string>('');
  const [registrationType, setRegistrationType] = useState<'lyrics_only' | 'complete'>('complete');
  const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false);
  const { profile } = useProfile();

  // Cleanup do áudio quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioElement.load();
      }
    };
  }, [audioElement]);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data,
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      genre: '',
      styleVariation: '',
      songVersion: '',
      registrationType: 'complete',
      additionalInfo: '',
      termsAccepted: false,
    },
  });

  const hasOtherAuthors = step1Form.watch('hasOtherAuthors');
  const otherAuthors = step1Form.watch('otherAuthors') || [];
  const currentRegistrationType = step2Form.watch('registrationType');

  // Handle "Eu mesmo" checkbox change
  const handleCurrentUserChange = (checked: boolean) => {
    setIsCurrentUser(checked);
    if (checked && profile) {
      step1Form.setValue('author', profile.name || '');
      step1Form.setValue('authorCpf', profile.cpf || '');
    } else {
      step1Form.setValue('author', '');
      step1Form.setValue('authorCpf', '');
    }
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAudioError('');

    if (!file) {
      setAudioFile(null);
      return;
    }

    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      setAudioError('Por favor, selecione um arquivo MP3 válido');
      setAudioFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAudioError('O arquivo deve ter no máximo 10MB');
      setAudioFile(null);
      return;
    }

    setAudioFile(file);
    
    // Limpa o áudio anterior se existir
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      setAudioElement(null);
    }
  };

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    // Validação condicional do áudio baseada no tipo de registro
    if (data.registrationType === 'complete' && !audioFile) {
      setAudioError('Arquivo de áudio é obrigatório para registro completo');
      return;
    }

    if (!lyrics.trim()) {
      return;
    }

    onSubmit({
      title: step1Data.title,
      author: step1Data.author,
      authorCpf: step1Data.authorCpf,
      hasOtherAuthors: step1Data.hasOtherAuthors,
      otherAuthors: step1Data.otherAuthors as Array<{ name: string; cpf: string; }>,
      genre: data.genre,
      styleVariation: data.styleVariation,
      songVersion: data.songVersion,
      lyrics: lyrics,
      additionalInfo: data.additionalInfo || '',
      termsAccepted: data.termsAccepted,
      audioFile,
    });
  };

  const addOtherAuthor = () => {
    const currentAuthors = step1Form.getValues('otherAuthors') || [];
    step1Form.setValue('otherAuthors', [...currentAuthors, { name: '', cpf: '' }]);
  };

  const removeOtherAuthor = (index: number) => {
    const currentAuthors = step1Form.getValues('otherAuthors') || [];
    const newAuthors = currentAuthors.filter((_, i) => i !== index);
    step1Form.setValue('otherAuthors', newAuthors);
  };

  const formatCpf = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    if (onlyNumbers.length <= 11) {
      return onlyNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return onlyNumbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const validateCpf = (cpf: string): boolean => {
    const onlyNumbers = cpf.replace(/\D/g, '');
    
    if (onlyNumbers.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(onlyNumbers)) return false;
    
    // Cálculo do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(onlyNumbers[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    // Cálculo do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(onlyNumbers[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    // Verificar se os dígitos calculados coincidem com os informados
    return parseInt(onlyNumbers[9]) === digit1 && parseInt(onlyNumbers[10]) === digit2;
  };

  const goBack = () => {
    setCurrentStep(1);
  };

  const toggleAudioPlayback = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!audioFile) {
      setAudioError('Nenhum arquivo de áudio selecionado');
      return;
    }

    // Se já está tocando, apenas pausar
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    // Se já existe um elemento pausado, retomar reprodução
    if (audioElement && !isPlaying) {
      audioElement.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Erro ao retomar reprodução:", err);
        setAudioError('Não foi possível retomar a reprodução.');
        setIsPlaying(false);
      });
      return;
    }

    // Criar novo elemento de áudio
    try {
      const audio = new Audio(URL.createObjectURL(audioFile));
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        console.error('Erro ao reproduzir áudio');
        setAudioError('Erro ao reproduzir o arquivo de áudio. Verifique se o arquivo está válido.');
        setIsPlaying(false);
        setAudioElement(null);
      };
      
      setAudioElement(audio);
      
      audio.play().then(() => {
        setIsPlaying(true);
        setAudioError(''); // Limpar erros anteriores
      }).catch(err => {
        console.error("Erro ao reproduzir áudio:", err);
        setAudioError('Não foi possível reproduzir o arquivo. Tente novamente.');
        setIsPlaying(false);
        setAudioElement(null);
      });
    } catch (error) {
      console.error('Erro ao criar elemento de áudio:', error);
      setAudioError('Erro ao processar o arquivo de áudio');
      setIsPlaying(false);
      setAudioElement(null);
    }
  };

  return (
    <Card className={isMobile ? "border-0 shadow-none" : ""}>
      <CardHeader className={isMobile ? "px-4 py-3" : ""}>
        <CardTitle className={isMobile ? "text-lg" : ""}>
          Registro Autoral - Etapa {currentStep} de 2
        </CardTitle>
        <CardDescription className={isMobile ? "text-sm" : ""}>
          {currentStep === 1 
            ? "Informe o título da obra e os dados dos autores"
            : "Informe os dados da obra musical"
          }
          <br />
          Você possui {userCredits} crédito(s) disponível(is).
        </CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "px-4 py-3" : ""}>
        {currentStep === 1 ? (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className={isMobile ? "space-y-4" : "space-y-6"}>
              {/* Título */}
              <FormField
                control={step1Form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da Obra *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o título da música" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkbox "Eu mesmo" */}
              <div className="flex items-center space-x-3 mb-4">
                <Checkbox
                  id="current-user"
                  checked={isCurrentUser}
                  onCheckedChange={handleCurrentUserChange}
                  disabled={!profile?.name || !profile?.cpf}
                />
                <Label 
                  htmlFor="current-user" 
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    !profile?.name || !profile?.cpf ? 'text-muted-foreground' : 'cursor-pointer'
                  }`}
                >
                  Eu mesmo
                  {(!profile?.name || !profile?.cpf) && (
                    <span className="text-xs text-muted-foreground block">
                      (Complete seu perfil para usar esta opção)
                    </span>
                  )}
                </Label>
              </div>

              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {/* Autor */}
                <FormField
                  control={step1Form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autor Principal *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome do autor principal" 
                          {...field}
                          disabled={isCurrentUser}
                          className={isCurrentUser ? 'bg-muted' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CPF do Autor */}
                <FormField
                  control={step1Form.control}
                  name="authorCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do Autor *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          {...field}
                          disabled={isCurrentUser}
                          className={isCurrentUser ? 'bg-muted' : ''}
                          onChange={(e) => {
                            if (!isCurrentUser) {
                              const formatted = formatCpf(e.target.value);
                              field.onChange(formatted);
                              
                              // Validação em tempo real
                              if (e.target.value && !validateCpf(formatted)) {
                                step1Form.setError('authorCpf', { 
                                  type: 'custom', 
                                  message: 'CPF inválido' 
                                });
                              } else {
                                step1Form.clearErrors('authorCpf');
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Possui outros autores */}
              <FormField
                control={step1Form.control}
                name="hasOtherAuthors"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            step1Form.setValue('otherAuthors', []);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Esta música possui co-autores?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Lista de outros autores */}
              {hasOtherAuthors && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Co-Autores</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOtherAuthor}
                    >
                      Adicionar Co-Autor
                    </Button>
                  </div>
                  
                  {otherAuthors.map((author, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Co-Autor {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOtherAuthor(index)}
                        >
                          Remover
                        </Button>
                      </div>
                      
                      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <FormField
                          control={step1Form.control}
                          name={`otherAuthors.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o nome completo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={step1Form.control}
                          name={`otherAuthors.${index}.cpf`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="000.000.000-00" 
                                  {...field}
                                  onChange={(e) => {
                                    const formatted = formatCpf(e.target.value);
                                    field.onChange(formatted);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {otherAuthors.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Clique em "Adicionar Co-Autor" para incluir co-autores
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" className="flex items-center gap-2">
                  Próxima Etapa
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className={isMobile ? "space-y-4" : "space-y-6"}>
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {/* Gênero */}
                <FormField
                  control={step2Form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero Musical *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Rock, Pop, Samba" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Variação do Estilo */}
                <FormField
                  control={step2Form.control}
                  name="styleVariation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variação do Estilo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Balada, Uptempo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Versão da música */}
              <FormField
                control={step2Form.control}
                name="songVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão da música (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Original, Remix, Acústica (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Letra */}
              <div className="space-y-2">
                <Label>Letra da Música *</Label>
                <Textarea 
                  placeholder="Digite a letra completa da música"
                  className={isMobile ? "min-h-24 text-sm" : "min-h-32"}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                />
                {!lyrics.trim() && (
                  <p className="text-sm text-red-500">Letra é obrigatória</p>
                )}
              </div>

              {/* Tipo de Registro */}
              <FormField
                control={step2Form.control}
                name="registrationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Registro *</FormLabel>
                    <FormDescription className="mb-4">
                      Escolha o tipo de registro que deseja realizar
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setRegistrationType(value as 'lyrics_only' | 'complete');
                        }}
                        className="grid grid-cols-1 gap-4"
                      >
                        <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="complete" id="complete" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="complete" className="cursor-pointer font-medium text-sm">
                              Registro completo (letra + áudio)
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Registra a letra e a música completa. É obrigatório anexar arquivo de áudio MP3.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="lyrics_only" id="lyrics_only" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="lyrics_only" className="cursor-pointer font-medium text-sm">
                              Registro de obra apenas letra
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Registra apenas a letra da música. Não é necessário anexar arquivo de áudio.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload de áudio - Condicional baseado no tipo */}
              {currentRegistrationType === 'complete' && (
              <div className="space-y-2">
                <Label className={isMobile ? "text-sm" : ""}>Upload do áudio (MP3) *</Label>
                <div className={`border-2 border-dashed border-muted-foreground/25 rounded-lg relative ${isMobile ? 'p-4' : 'p-6'}`}>
                  <div className="flex flex-col items-center justify-center space-y-2">
                    {audioFile ? (
                      <>
                        <FileAudio className={isMobile ? "h-6 w-6 text-primary" : "h-8 w-8 text-primary"} />
                        <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{audioFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="flex items-center gap-2 mt-2 z-10 relative">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={toggleAudioPlayback}
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Reproduzir
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-primary">Clique na área para alterar o arquivo</p>
                      </>
                    ) : (
                      <>
                        <Upload className={isMobile ? "h-6 w-6 text-muted-foreground" : "h-8 w-8 text-muted-foreground"} />
                        <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          Clique para selecionar o arquivo MP3
                        </p>
                        {!isMobile && (
                          <p className="text-xs text-muted-foreground">
                            Ou arraste e solte aqui
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".mp3,audio/mpeg,audio/mp3"
                    onChange={handleAudioFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: audioFile ? 1 : 10 }}
                  />
                </div>
                {audioError && (
                  <p className="text-sm text-red-500">{audioError}</p>
                )}
                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Máximo 10MB, apenas arquivos MP3
                </p>
              </div>
              )}

              {/* Informações adicionais */}
              <FormField
                control={step2Form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informações adicionais</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações extras sobre a música (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Aceitar termos */}
              <FormField
                control={step2Form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Aceito os termos e condições de registro autoral *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={goBack} className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Etapa Anterior
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    userCredits <= 0 || 
                    !lyrics.trim() || 
                    (currentRegistrationType === 'complete' && !audioFile)
                  } 
                  className="flex items-center gap-2"
                >
                  {userCredits <= 0 ? 'Créditos Insuficientes' : 'Registrar Obra'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};