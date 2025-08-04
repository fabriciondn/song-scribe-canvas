import React, { useState } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Upload, FileAudio } from 'lucide-react';
import { AuthorRegistrationData } from '@/pages/AuthorRegistration';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3'];

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  author: z.string().min(1, 'Autor é obrigatório'),
  authorCpf: z.string().min(11, 'CPF deve ter pelo menos 11 dígitos').max(14, 'CPF inválido'),
  hasOtherAuthors: z.boolean(),
  otherAuthors: z.array(z.object({
    name: z.string(),
    cpf: z.string(),
  })).default([]),
  genre: z.string().min(1, 'Gênero é obrigatório'),
  styleVariation: z.string().min(1, 'Variação do estilo é obrigatória'),
  songVersion: z.string().optional(),
  lyrics: z.string().min(1, 'Letra é obrigatória'),
  additionalInfo: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos para continuar',
  }),
}).refine((data) => {
  if (data.hasOtherAuthors && (!data.otherAuthors || data.otherAuthors.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Quando há outros autores, pelo menos um deve ser adicionado',
  path: ['otherAuthors'],
});

type FormData = z.infer<typeof formSchema>;

interface AuthorRegistrationFormProps {
  initialData: AuthorRegistrationData;
  onSubmit: (data: AuthorRegistrationData) => void;
  userCredits: number;
}

export const AuthorRegistrationForm: React.FC<AuthorRegistrationFormProps> = ({
  initialData,
  onSubmit,
  userCredits,
}) => {
  const { isMobile } = useMobileDetection();
  const [audioFile, setAudioFile] = useState<File | null>(initialData.audioFile);
  const [audioError, setAudioError] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      author: initialData.author,
      authorCpf: initialData.authorCpf,
      hasOtherAuthors: initialData.hasOtherAuthors,
      otherAuthors: initialData.otherAuthors,
      genre: initialData.genre,
      styleVariation: initialData.styleVariation,
      songVersion: initialData.songVersion,
      lyrics: initialData.lyrics,
      additionalInfo: initialData.additionalInfo,
      termsAccepted: initialData.termsAccepted,
    },
  });

  const hasOtherAuthors = form.watch('hasOtherAuthors');
  const otherAuthors = form.watch('otherAuthors') || [];

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAudioError('');

    if (!file) {
      setAudioFile(null);
      return;
    }

    // Validate file type
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      setAudioError('Por favor, selecione um arquivo MP3 válido');
      setAudioFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setAudioError('O arquivo deve ter no máximo 10MB');
      setAudioFile(null);
      return;
    }

    setAudioFile(file);
  };

  const handleFormSubmit = (data: FormData) => {
    if (!audioFile) {
      setAudioError('Arquivo de áudio é obrigatório');
      return;
    }

    onSubmit({
      title: data.title,
      author: data.author,
      authorCpf: data.authorCpf,
      hasOtherAuthors: data.hasOtherAuthors,
      otherAuthors: data.otherAuthors as Array<{ name: string; cpf: string; }>,
      genre: data.genre,
      styleVariation: data.styleVariation,
      songVersion: data.songVersion,
      lyrics: data.lyrics,
      termsAccepted: data.termsAccepted,
      additionalInfo: data.additionalInfo || '',
      audioFile,
    });
  };

  const addOtherAuthor = () => {
    const currentAuthors = form.getValues('otherAuthors') || [];
    form.setValue('otherAuthors', [...currentAuthors, { name: '', cpf: '' }] as Array<{ name: string; cpf: string; }>);
  };

  const removeOtherAuthor = (index: number) => {
    const currentAuthors = form.getValues('otherAuthors') || [];
    const newAuthors = currentAuthors.filter((_, i) => i !== index);
    form.setValue('otherAuthors', newAuthors);
  };

  const formatCpf = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    if (onlyNumbers.length <= 11) {
      return onlyNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return onlyNumbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const isFormValid = form.formState.isValid && audioFile && !audioError;

  return (
    <Card className={isMobile ? "border-0 shadow-none" : ""}>
      <CardHeader className={isMobile ? "px-4 py-3" : ""}>
        <CardTitle className={isMobile ? "text-lg" : ""}>
          Formulário de Registro Autoral
        </CardTitle>
        <CardDescription className={isMobile ? "text-sm" : ""}>
          Preencha todos os campos para registrar sua música. 
          Você possui {userCredits} crédito(s) disponível(is).
        </CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "px-4 py-3" : ""}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className={isMobile ? "space-y-4" : "space-y-6"}>
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da música" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* Autor */}
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autor *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do autor principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF do Autor */}
              <FormField
                control={form.control}
                name="authorCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Autor *</FormLabel>
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

            {/* Possui outros autores */}
            <FormField
              control={form.control}
              name="hasOtherAuthors"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue('otherAuthors', []);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Esta música possui outros autores?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Lista de outros autores */}
            {hasOtherAuthors && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Outros Autores</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOtherAuthor}
                  >
                    Adicionar Autor
                  </Button>
                </div>
                
                {otherAuthors.map((author, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Autor {index + 1}</h4>
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
                        control={form.control}
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
                        control={form.control}
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
                    Clique em "Adicionar Autor" para incluir outros autores
                  </p>
                )}
              </div>
            )}

            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* Gênero */}
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Rock, Pop, Samba" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variação do Estilo */}
              <FormField
                control={form.control}
                name="styleVariation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variação do Estilo *</FormLabel>
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
              control={form.control}
              name="songVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versão da música</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Original, Remix, Acústica (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Letra */}
            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Letra *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite a letra completa da música"
                      className={isMobile ? "min-h-24 text-sm" : "min-h-32"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de áudio */}
            <div className="space-y-2">
              <Label className={isMobile ? "text-sm" : ""}>Upload do áudio (MP3) *</Label>
              <div className={`border-2 border-dashed border-muted-foreground/25 rounded-lg relative cursor-pointer hover:border-muted-foreground/50 transition-colors ${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  {audioFile ? (
                    <>
                      <FileAudio className={isMobile ? "h-6 w-6 text-primary" : "h-8 w-8 text-primary"} />
                      <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{audioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-primary">Clique para alterar o arquivo</p>
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
                />
              </div>
              {audioError && (
                <p className="text-sm text-red-500">{audioError}</p>
              )}
              <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                Máximo 10MB, apenas arquivos MP3
              </p>
            </div>

            {/* Informações adicionais */}
            <FormField
              control={form.control}
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
              control={form.control}
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
                      Aceito os termos e condições *
                    </FormLabel>
                    <FormDescription>
                      Ao aceitar, você concorda com nossos{' '}
                      <a href="#" className="text-primary underline">
                        termos de uso
                      </a>{' '}
                      e{' '}
                      <a href="#" className="text-primary underline">
                        política de privacidade
                      </a>
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={isMobile ? "pt-4" : "flex justify-end"}>
              <Button 
                type="submit" 
                size={isMobile ? "default" : "lg"}
                disabled={!isFormValid}
                className={isMobile ? "w-full" : ""}
              >
                Revisar Registro
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};