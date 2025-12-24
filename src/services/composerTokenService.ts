import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

export interface ComposerToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidatedComposer {
  id: string;
  name: string;
  artisticName: string | null;
  cpf: string;
}

// Gerar token único para o compositor
export const generateComposerToken = async (expirationDays: number = 30): Promise<ComposerToken> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Desativar tokens anteriores do mesmo usuário
  await supabase
    .from('composer_tokens')
    .update({ is_active: false })
    .eq('user_id', user.id);

  // Gerar novo token
  const token = `CPT-${nanoid(12).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  const { data, error } = await supabase
    .from('composer_tokens')
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao gerar token:', error);
    throw new Error('Não foi possível gerar o token');
  }

  return data as ComposerToken;
};

// Obter token ativo do usuário atual
export const getMyActiveToken = async (): Promise<ComposerToken | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('composer_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar token:', error);
    return null;
  }

  return data as ComposerToken | null;
};

// Validar token e retornar dados do compositor
export const validateComposerToken = async (token: string): Promise<{ valid: boolean; composer?: ValidatedComposer; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { valid: false, error: 'Usuário não autenticado' };
  }

  // Buscar token
  const { data: tokenData, error: tokenError } = await supabase
    .from('composer_tokens')
    .select('*')
    .eq('token', token.trim().toUpperCase())
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (tokenError || !tokenData) {
    return { valid: false, error: 'Token inválido ou expirado' };
  }

  const typedTokenData = tokenData as ComposerToken;

  // Verificar se não é o próprio usuário
  if (typedTokenData.user_id === user.id) {
    return { valid: false, error: 'Você não pode usar seu próprio token' };
  }

  // Buscar dados do compositor (dono do token)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, artistic_name, cpf')
    .eq('id', typedTokenData.user_id)
    .single();

  if (profileError || !profile) {
    return { valid: false, error: 'Compositor não encontrado' };
  }

  // Verificar se o perfil tem os dados necessários
  if (!profile.name || !profile.cpf) {
    return { valid: false, error: 'O compositor precisa completar o perfil (nome e CPF)' };
  }

  return {
    valid: true,
    composer: {
      id: profile.id,
      name: profile.name,
      artisticName: profile.artistic_name,
      cpf: profile.cpf,
    },
  };
};

// Buscar histórico de registros feitos em parceria
export const getPartnershipRegistrations = async (): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Buscar registros onde o usuário é autor principal ou coautor
  const { data, error } = await supabase
    .from('author_registrations')
    .select('*')
    .or(`user_id.eq.${user.id},other_authors.cs.[{"cpf":"${user.id}"}]`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar registros:', error);
    return [];
  }

  // Filtrar apenas os que têm outros autores
  return (data || []).filter(reg => reg.other_authors && reg.other_authors.length > 0);
};

// Revogar token ativo
export const revokeMyToken = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await supabase
    .from('composer_tokens')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('Erro ao revogar token:', error);
    throw new Error('Não foi possível revogar o token');
  }
};
