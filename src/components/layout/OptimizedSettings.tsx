import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Settings as SettingsIcon, Save, Loader2, Search, Guitar, Piano, Mic, Drum, Music } from 'lucide-react';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { cn } from '@/lib/utils';

// Lazy load components que não são essenciais inicialmente
const Calendar = lazy(() => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar })));
const Popover = lazy(() => import('@/components/ui/popover').then(mod => ({ default: mod.Popover })));
const PopoverContent = lazy(() => import('@/components/ui/popover').then(mod => ({ default: mod.PopoverContent })));
const PopoverTrigger = lazy(() => import('@/components/ui/popover').then(mod => ({ default: mod.PopoverTrigger })));

// Avatar options da plataforma com ícones de instrumentos
const platformAvatars = [
  { id: '1', icon: 'guitar', name: 'Guitarra' },
  { id: '2', icon: 'piano', name: 'Piano' },
  { id: '3', icon: 'microphone', name: 'Microfone' },
  { id: '4', icon: 'drum', name: 'Bateria' },
  { id: '5', icon: 'violin', name: 'Violino' },
];

const settingsSchema = z.object({
  artistic_name: z.string().min(2, 'Nome artístico deve ter pelo menos 2 caracteres').optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').optional(),
  birth_date: z.date().optional(),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos').optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function OptimizedSettings() {
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar, isLoading } = useProfile();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      artistic_name: '',
      name: '',
      email: '',
      cpf: '',
      birth_date: undefined,
      cep: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  // Memoizar os dados do usuário para evitar re-renders desnecessários
  const userData = useMemo(() => ({
    id: user?.id,
    email: user?.email
  }), [user?.id, user?.email]);

  // Debounce para busca de CEP
  const searchCep = useCallback(async (cep: string) => {
    if (cep.length !== 8) return;
    
    setSearchingCep(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Erro na requisição');
      
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      form.setValue('street', data.logradouro || '');
      form.setValue('neighborhood', data.bairro || '');
      form.setValue('city', data.localidade || '');
      form.setValue('state', data.uf || '');
      
      toast.success('Endereço encontrado!');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Timeout na busca do CEP');
      } else {
        toast.error('Erro ao buscar CEP');
      }
    } finally {
      setSearchingCep(false);
    }
  }, [form]);

  // Atualizar form quando o profile carrega
  useEffect(() => {
    if (profile && userData.id) {
      form.reset({
        artistic_name: (profile as any).artistic_name || '',
        name: profile.name || '',
        email: profile.email || userData.email || '',
        cpf: profile.cpf || '',
        birth_date: (profile as any).birth_date ? new Date((profile as any).birth_date) : undefined,
        cep: (profile as any).cep || '',
        street: (profile as any).street || '',
        number: (profile as any).number || '',
        neighborhood: (profile as any).neighborhood || '',
        city: (profile as any).city || '',
        state: (profile as any).state || '',
      });
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile, userData, form]);

  const handleUploadAvatar = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      // Validar tamanho do arquivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB.');
      }

      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      setSelectedAvatar('');
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do avatar');
    } finally {
      setUploading(false);
    }
  }, [uploadAvatar]);

  const selectPlatformAvatar = useCallback(async (avatarIcon: string) => {
    try {
      setSelectedAvatar(avatarIcon);
      setAvatarUrl(avatarIcon);
      await updateProfile({ avatar_url: avatarIcon });
      toast.success('Avatar selecionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao selecionar avatar');
    }
  }, [updateProfile]);

  const getIconComponent = useCallback((iconName: string) => {
    const icons = {
      guitar: Guitar,
      piano: Piano,
      microphone: Mic,
      drum: Drum,
      violin: Music
    };
    return icons[iconName as keyof typeof icons] || Music;
  }, []);

  const onSubmit = useCallback(async (data: SettingsForm) => {
    if (!userData.id) return;

    try {
      setLoading(true);

      const updateData = {
        ...data,
        avatar_url: avatarUrl,
        birth_date: data.birth_date?.toISOString(),
      };

      await updateProfile(updateData);
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  }, [userData.id, avatarUrl, updateProfile]);

  if (!userData.id) {
    return (
      <ResponsiveContainer>
        <div className="flex items-center justify-center h-64">
          <p>Faça login para acessar as configurações</p>
        </div>
      </ResponsiveContainer>
    );
  }

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Foto de Perfil</h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full border-2 border-border bg-card flex items-center justify-center">
                  {avatarUrl && platformAvatars.find(a => a.icon === avatarUrl) ? (
                    (() => {
                      const IconComponent = getIconComponent(avatarUrl);
                      return <IconComponent className="w-12 h-12 text-primary" />;
                    })()
                  ) : avatarUrl ? (
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-xl">
                        {form.watch('name')?.[0]?.toUpperCase() || userData.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="text-xl font-semibold text-muted-foreground">
                      {form.watch('name')?.[0]?.toUpperCase() || userData.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadAvatar}
                      disabled={uploading}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? 'Enviando...' : 'Fazer Upload'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Platform Avatars */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Ou escolha um ícone de instrumento:</h4>
                <div className="grid grid-cols-5 gap-3">
                  {platformAvatars.map((avatar) => {
                    const IconComponent = getIconComponent(avatar.icon);
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => selectPlatformAvatar(avatar.icon)}
                        className={cn(
                          "relative rounded-full border-2 transition-colors p-4 flex items-center justify-center bg-card hover:bg-accent",
                          selectedAvatar === avatar.icon || avatarUrl === avatar.icon
                            ? "border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                        title={avatar.name}
                      >
                        <IconComponent className="w-8 h-8 text-primary" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="artistic_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Artístico</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome artístico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="seu@email.com" 
                            type="email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...field} 
                            maxLength={14}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Section com lazy loading */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Endereço</h3>
                  
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="00000-000" 
                              {...field} 
                              maxLength={9}
                              onChange={(e) => {
                                field.onChange(e);
                                const cep = e.target.value.replace(/\D/g, '');
                                if (cep.length === 8) {
                                  searchCep(cep);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const cep = field.value?.replace(/\D/g, '');
                                if (cep && cep.length === 8) {
                                  searchCep(cep);
                                }
                              }}
                              disabled={searchingCep}
                            >
                              {searchingCep ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Outros campos do endereço */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rua</FormLabel>
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
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
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
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="Estado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}