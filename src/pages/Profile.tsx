import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Save, Loader2 } from 'lucide-react';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').optional(),
  cellphone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const PROFILE_DRAFT_KEY = 'profile-form-draft';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      cpf: '',
      cellphone: '',
      address: '',
    },
  });

  // Salvar rascunho no sessionStorage quando os dados mudarem
  const formValues = form.watch();
  
  useEffect(() => {
    if (profileLoaded && user) {
      const draft = {
        ...formValues,
        avatarUrl,
      };
      sessionStorage.setItem(`${PROFILE_DRAFT_KEY}-${user.id}`, JSON.stringify(draft));
    }
  }, [formValues, avatarUrl, profileLoaded, user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      // Primeiro, verificar se há rascunho salvo
      const savedDraft = sessionStorage.getItem(`${PROFILE_DRAFT_KEY}-${user.id}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (savedDraft) {
        // Se há rascunho, usar os dados do rascunho
        const draft = JSON.parse(savedDraft);
        form.reset({
          name: draft.name || data?.name || '',
          username: draft.username || data?.username || '',
          email: draft.email || data?.email || user.email || '',
          cpf: draft.cpf || data?.cpf || '',
          cellphone: draft.cellphone || (data as any)?.cellphone || '',
          address: draft.address || data?.address || '',
        });
        setAvatarUrl(draft.avatarUrl || data?.avatar_url || '');
      } else if (data) {
        form.reset({
          name: data.name || '',
          username: data.username || '',
          email: data.email || user.email || '',
          cpf: data.cpf || '',
          cellphone: (data as any).cellphone || '',
          address: data.address || '',
        });
        setAvatarUrl(data.avatar_url || '');
      } else {
        // Create profile if it doesn't exist
        form.reset({
          email: user.email || '',
        });
      }
      
      setProfileLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar perfil');
      setProfileLoaded(true);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast.error('Erro ao fazer upload do avatar');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;

    try {
      setLoading(true);

      const updateData = {
        ...data,
        avatar_url: avatarUrl,
        email: data.email,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          ...updateData 
        });

      if (error) throw error;

      // Limpar rascunho após salvar com sucesso
      sessionStorage.removeItem(`${PROFILE_DRAFT_KEY}-${user.id}`);
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ResponsiveContainer>
        <div className="flex items-center justify-center h-64">
          <p>Faça login para acessar seu perfil</p>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl">
                  {form.watch('name')?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
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
                  {uploading ? 'Enviando...' : 'Alterar Foto'}
                </Button>
              </div>
            </div>

            {/* Profile Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome de usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="cellphone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 99999-9999" 
                          {...field} 
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Seu endereço completo"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {loading ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}