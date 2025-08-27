
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useImpersonation } from '@/context/ImpersonationContext';
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
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoizar o user ID para evitar re-renders desnecessários
  const userId = useMemo(() => {
    if (isImpersonating && impersonatedUser?.id) return impersonatedUser.id;
    return user?.id;
  }, [user?.id, isImpersonating, impersonatedUser?.id]);

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
      console.log('🔧 Atualizando perfil com dados:', updates);
      
      // Criar objeto apenas com campos que existem na tabela profiles
      const profileUpdates: any = {};
      
      // Mapear campos permitidos
      const allowedFields = [
        'name', 'email', 'cpf', 'cellphone', 'address', 'avatar_url', 
        'credits', 'artistic_name', 'birth_date', 'cep', 'street', 
        'number', 'neighborhood', 'city', 'state'
      ];
      
      allowedFields.forEach(field => {
        if (updates.hasOwnProperty(field)) {
          profileUpdates[field] = updates[field as keyof UserProfile];
        }
      });

      console.log('📝 Campos a serem atualizados:', profileUpdates);

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        throw error;
      }

      console.log('✅ Perfil atualizado com sucesso');

      // Atualizar o estado local
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      return true;
    } catch (err) {
      console.error('❌ Erro ao atualizar perfil:', err);
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
