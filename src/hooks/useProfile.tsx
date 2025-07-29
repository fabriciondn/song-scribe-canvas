import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  cpf?: string;
  address?: string;
  avatar_url?: string;
  credits?: number;
  created_at?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          ...updates 
        });

      if (error) throw error;

      // Atualizar o estado local
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      return true;
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      throw err;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar o avatar_url no perfil
      await updateProfile({ avatar_url: data.publicUrl });

      return data.publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload do avatar:', err);
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    uploadAvatar,
  };
};