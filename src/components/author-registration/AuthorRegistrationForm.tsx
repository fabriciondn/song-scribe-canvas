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
  otherAuthors: z.string().optional(),
  genre: z.string().min(1, 'Gênero é obrigatório'),
  rhythm: z.string().min(1, 'Ritmo é obrigatório'),
  songVersion: z.string().min(1, 'Versão da música é obrigatória'),
  lyrics: z.string().min(1, 'Letra é obrigatória'),
  additionalInfo: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos para continuar',
  }),
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
  const [audioFile, setAudioFile] = useState<File | null>(initialData.audioFile);
  const [audioError, setAudioError] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      author: initialData.author,
      otherAuthors: initialData.otherAuthors,
      genre: initialData.genre,
      rhythm: initialData.rhythm,
      songVersion: initialData.songVersion,
      lyrics: initialData.lyrics,
      additionalInfo: initialData.additionalInfo,
      termsAccepted: initialData.termsAccepted,
    },
  });

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
      genre: data.genre,
      rhythm: data.rhythm,
      songVersion: data.songVersion,
      lyrics: data.lyrics,
      termsAccepted: data.termsAccepted,
      otherAuthors: data.otherAuthors || '',
      additionalInfo: data.additionalInfo || '',
      audioFile,
    });
  };

  const isFormValid = form.formState.isValid && audioFile && !audioError;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulário de Registro Autoral</CardTitle>
        <CardDescription>
          Preencha todos os campos para registrar sua música. 
          Você possui {userCredits} crédito(s) disponível(is).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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

            {/* Outros Autores */}
            <FormField
              control={form.control}
              name="otherAuthors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outros Autores</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite outros autores (opcional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Se houver outros autores, separe-os por vírgula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Ritmo */}
              <FormField
                control={form.control}
                name="rhythm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ritmo *</FormLabel>
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
                  <FormLabel>Versão da música *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Original, Remix, Acústica" {...field} />
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
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de áudio */}
            <div className="space-y-2">
              <Label>Upload do áudio (MP3) *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  {audioFile ? (
                    <>
                      <FileAudio className="h-8 w-8 text-primary" />
                      <p className="text-sm font-medium">{audioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Clique para selecionar o arquivo MP3
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".mp3,audio/mpeg"
                    onChange={handleAudioFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              {audioError && (
                <p className="text-sm text-red-500">{audioError}</p>
              )}
              <p className="text-xs text-muted-foreground">
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

            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="lg"
                disabled={!isFormValid}
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