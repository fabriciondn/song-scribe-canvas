import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Upload, CheckCircle2, Music, User, MapPin, FileText, ChevronRight, ChevronLeft, Mic } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import compuseLogo from '@/assets/logo-splash.png';

const workSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  genre: z.string().min(1, 'Gênero é obrigatório'),
  lyrics: z.string().min(1, 'Letra é obrigatória'),
  audioFile: z.any().optional(),
  previewUrl: z.string().optional(),
});

const formSchema = z.object({
  // Step 1: Personal Data
  artisticName: z.string().optional(),
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  birthDate: z.string().min(10, 'Data inválida').optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  
  // Step 2: Address
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
});

const genres = [
  "Sertanejo", "Pop", "Rock", "Pagode", "Samba", 
  "Funk", "MPB", "Gospel", "Rap/Hip Hop", "Forró", 
  "Axé", "Eletrônica", "Jazz", "Blues", "Clássico", "Outro"
];

export default function PublicRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState<number | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [works, setWorks] = useState<z.infer<typeof workSchema>[]>([{ title: '', genre: '', lyrics: '', audioFile: null, previewUrl: '' }]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      artisticName: '',
      email: '',
      fullName: '',
      cpf: '',
      birthDate: '',
      cep: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      phone: '',
      password: '',
    },
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('compuse_registration_form');
    if (savedData) {
      try {
        const { step, formData, worksData } = JSON.parse(savedData);
        if (step) setCurrentStep(step);
        if (formData) {
          // Use reset with a small delay to ensure the form is ready
          setTimeout(() => {
            form.reset(formData);
          }, 100);
        }
        if (worksData && worksData.length > 0) {
          // Clear file references as they can't be restored from string
          const cleanedWorks = worksData.map((w: any) => ({
            ...w,
            audioFile: null,
            previewUrl: ''
          }));
          setWorks(cleanedWorks);
        }
      } catch (e) {
        console.error('Error parsing saved form data', e);
      }
    }
  }, []);

  // Save data to localStorage whenever something changes
  useEffect(() => {
    const formData = form.getValues();
    const dataToSave = {
      step: currentStep,
      formData,
      worksData: works.map(w => ({
        title: w.title,
        genre: w.genre,
        lyrics: w.lyrics
      }))
    };
    localStorage.setItem('compuse_registration_form', JSON.stringify(dataToSave));
  }, [currentStep, works, form.watch()]); // watch() ensures it triggers on form changes


  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('street', data.logradouro || '');
        form.setValue('neighborhood', data.bairro || '');
        form.setValue('city', data.localidade || '');
        form.setValue('state', data.uf || '');
        form.trigger(['street', 'neighborhood', 'city', 'state']);
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 8);
    form.setValue('cep', value);
    if (value.length === 8) {
      fetchAddressByCep(value);
    }
  };

  const addWork = () => {
    setWorks([...works, { title: '', genre: '', lyrics: '', audioFile: null, previewUrl: '' }]);
  };

  const removeWork = (index: number) => {
    if (works.length > 1) {
      const newWorks = [...works];
      newWorks.splice(index, 1);
      setWorks(newWorks);
    }
  };

  const updateWork = (index: number, field: keyof z.infer<typeof workSchema>, value: any) => {
    const newWorks = [...works];
    newWorks[index] = { ...newWorks[index], [field]: value };
    setWorks(newWorks);
  };

  const handleAudioUpload = async (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    
    // Update both audio file and preview URL
    setWorks(prev => {
      const newWorks = [...prev];
      newWorks[index] = { ...newWorks[index], audioFile: file, previewUrl };
      return newWorks;
    });
    
    // Auto-transcribe
    setIsTranscribing(index);
    setTranscriptionProgress(0);
    
    // Simulate progress while waiting for the API
    const progressInterval = setInterval(() => {
      setTranscriptionProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 5;
      });
    }, 800);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: formData,
      });

      if (error) throw error;

      if (data?.text) {
        setTranscriptionProgress(100);
        setWorks(prev => {
          const newWorks = [...prev];
          newWorks[index] = { ...newWorks[index], lyrics: data.text };
          return newWorks;
        });
        toast.success(`Áudio da música "${works[index].title || index + 1}" transcrito com sucesso!`);
      }
    } catch (error: any) {
      console.error('Erro na transcrição:', error);
      toast.error('Erro ao transcrever o áudio automaticamente.');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsTranscribing(null);
        setTranscriptionProgress(0);
      }, 500);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['fullName', 'email', 'cpf', 'password'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      toast.error('Por favor, preencha todos os campos obrigatórios corretamente.');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate works
    const invalidWorks = works.filter(w => !w.title || !w.genre || !w.lyrics);
    if (invalidWorks.length > 0) {
      toast.error('Por favor, preencha todos os dados de todas as músicas.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload audio files if any
      const worksWithUrls = await Promise.all(works.map(async (work) => {
        if (work.audioFile) {
          const fileExt = work.audioFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `public-registrations/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('author-registrations')
            .upload(filePath, work.audioFile);

          if (uploadError) throw uploadError;

          return {
            title: work.title,
            genre: work.genre,
            lyrics: work.lyrics,
            audio_url: filePath
          };
        }
        return {
          title: work.title,
          genre: work.genre,
          lyrics: work.lyrics
        };
      }));

      // 2. Insert into database
      const { error } = await supabase
        .from('public_registration_forms')
        .insert({
          email: values.email,
          full_name: values.fullName,
          cpf: values.cpf,
          birth_date: values.birthDate ? values.birthDate.split('/').reverse().join('-') : null,
          cep: values.cep,
          street: values.street,
          number: values.number,
          neighborhood: values.neighborhood,
          city: values.city,
          state: values.state,
          phone: values.phone,
          artistic_name: values.artisticName || null,
          password: values.password,
          works: worksWithUrls,
        });

      if (error) throw error;

      toast.success('Registro enviado com sucesso!');
      setIsSubmitted(true);
      form.reset();
      setWorks([{ title: '', genre: '', lyrics: '', audioFile: null, previewUrl: '' }]);
      localStorage.removeItem('compuse_registration_form');

    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      toast.error('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <CheckCircle2 className="h-20 w-20 text-primary" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Registro Recebido com Sucesso!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Seu cadastro e suas obras foram recebidos. Em breve, nossa equipe entrará em contato para confirmar seu acesso à plataforma Compuse.
            </p>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Enviar outro registro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 py-8 md:py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <img 
            src={compuseLogo}
            alt="Compuse Logo" 
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold tracking-tight">Registro de Autor e Obra</h1>
          <p className="text-muted-foreground">Complete as 3 etapas para garantir sua proteção autoral</p>
        </div>

        {/* Custom Stepper */}
        <div className="relative pt-4 pb-8">
          <div className="flex justify-between items-center relative z-10">
            {[
              { step: 1, icon: User, label: "Pessoal" },
              { step: 2, icon: MapPin, label: "Endereço" },
              { step: 3, icon: Music, label: "Obras" }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    currentStep >= item.step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <span className={`text-xs mt-2 font-medium ${currentStep >= item.step ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-9 left-0 w-full h-0.5 bg-muted -z-0">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* STEP 1: Personal Data */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="artisticName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Artístico (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Como você é conhecido" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail *</FormLabel>
                            <FormControl>
                              <Input placeholder="seu@email.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha de Acesso *</FormLabel>
                            <FormControl>
                              <Input placeholder="Mínimo 6 caracteres" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000.000.000-00" 
                                {...field} 
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').substring(0, 11);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Address */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="00000-000" 
                                value={field.value}
                                onChange={handleCepChange}
                              />
                              {isLoadingCep && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Rua *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da rua" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número *</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro *</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade *</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado *</FormLabel>
                            <FormControl>
                              <Input placeholder="UF" {...field} maxLength={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Works */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    {works.map((work, index) => (
                      <div key={index} className="p-6 border rounded-xl bg-muted/30 space-y-4 relative group">
                        {works.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute -top-3 -right-3 bg-background border shadow-sm text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            onClick={() => removeWork(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Music className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold">Música {index + 1}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FormLabel>Título da Música *</FormLabel>
                            <Input 
                              placeholder="Título da obra" 
                              value={work.title}
                              onChange={(e) => updateWork(index, 'title', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Gênero *</FormLabel>
                            <Select 
                              value={work.genre} 
                              onValueChange={(val) => updateWork(index, 'genre', val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                              <SelectContent>
                                {genres.map(g => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                          <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                              <FormLabel>Letra *</FormLabel>
                              {isTranscribing === index && (
                                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Transcrevendo áudio ({transcriptionProgress}%)
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <Textarea 
                                placeholder="A letra será preenchida automaticamente ao subir o áudio, ou você pode digitar aqui." 
                                className={`min-h-[120px] transition-all duration-300 ${isTranscribing === index ? 'opacity-50 grayscale-[50%]' : ''}`}
                                value={work.lyrics}
                                onChange={(e) => updateWork(index, 'lyrics', e.target.value)}
                              />
                              {isTranscribing === index && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4">
                                  <div className="w-full max-w-[200px] space-y-2">
                                    <Progress value={transcriptionProgress} className="h-2" />
                                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">Processando inteligência artificial</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                        <div className="space-y-2">
                          <FormLabel>Upload do Áudio</FormLabel>
                          <div className="flex items-center gap-4">
                            <label className="flex-1">
                              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors bg-background/50 group-hover:bg-background">
                                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  {work.audioFile ? work.audioFile.name : 'Selecionar arquivo de áudio'}
                                </span>
                                <input 
                                  type="file" 
                                  accept="audio/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAudioUpload(index, file);
                                  }}
                                />
                              </div>
                            </label>
                            {work.audioFile && !isTranscribing && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleAudioUpload(index, work.audioFile)}
                                title="Transcrever novamente"
                              >
                                <Mic className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          </div>
                          
                          {work.previewUrl && (
                            <div className="mt-4 p-4 bg-background rounded-xl border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                  <Music className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">Ouvir áudio selecionado</span>
                              </div>
                              <audio 
                                controls 
                                className="w-full h-10"
                                src={work.previewUrl}
                              >
                                Seu navegador não suporta o elemento de áudio.
                              </audio>
                            </div>
                          )}
                        </div>
                      ))}

                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full border-dashed border-2 py-8 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50"
                      onClick={addWork}
                      disabled={isTranscribing !== null}
                    >
                      <Plus className="h-6 w-6" />
                      Adicionar outra música para registro
                    </Button>
                  </div>
                )}

                {/* NAVIGATION BUTTONS */}
                <div className="flex justify-between pt-6 border-t">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 3 ? (
                    <Button type="button" onClick={nextStep} disabled={isTranscribing !== null}>
                      Próxima Etapa
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading || isTranscribing !== null} className="px-8 bg-primary hover:bg-primary/90 text-white font-bold">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finalizando Registro...
                        </>
                      ) : (
                        'Concluir e Enviar Registro'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
