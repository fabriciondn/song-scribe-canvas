import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  cpf?: string;
  cellphone?: string;
  address?: string;
  avatar_url?: string;
  credits?: number;
  created_at?: string;
  artistic_name?: string;
  birth_date?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoizar o user ID para evitar re-renders desnecessários
  const userId = useMemo(() => user?.id, [user?.id]);

  // Memoizar a função loadProfile para evitar re-criações desnecessárias
  const loadProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [userId, loadProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userId) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
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
  }, [userId]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!userId) throw new Error('Usuário não autenticado');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

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
  }, [userId, updateProfile]);

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    uploadAvatar,
  };
};