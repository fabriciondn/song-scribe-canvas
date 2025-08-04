import { supabase } from '@/integrations/supabase/client';

export interface ModeratorRegistrationToken {
  id: string;
  token: string;
  created_by: string;
  expires_at: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

// Gerar token de cadastro para moderador (só admin pode fazer)
export const generateModeratorRegistrationToken = async (daysValid: number = 7): Promise<string> => {
  // Obter usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);

  const { error } = await supabase
    .from('moderator_registration_tokens')
    .insert({
      token,
      created_by: user.id,
      expires_at: expiresAt.toISOString()
    });

  if (error) {
    console.error('Error generating moderator token:', error);
    throw new Error('Erro ao gerar token de cadastro: ' + error.message);
  }

  return token;
};

// Validar token de cadastro
export const validateModeratorRegistrationToken = async (token: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('moderator_registration_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return false;
  }

  return true;
};

// Marcar token como usado
export const markTokenAsUsed = async (token: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('moderator_registration_tokens')
    .update({
      used: true,
      used_by: userId,
      used_at: new Date().toISOString()
    })
    .eq('token', token);

  if (error) {
    console.error('Error marking token as used:', error);
    throw new Error('Erro ao marcar token como usado');
  }
};

// Listar tokens criados (só admin)
export const listModeratorRegistrationTokens = async (): Promise<ModeratorRegistrationToken[]> => {
  const { data, error } = await supabase
    .from('moderator_registration_tokens')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing tokens:', error);
    throw new Error('Erro ao listar tokens');
  }

  return data || [];
};

// Gerar token seguro
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Gerar URL completa para cadastro
export const generateModeratorRegistrationUrl = (token: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/moderator-auth?token=${token}`;
};