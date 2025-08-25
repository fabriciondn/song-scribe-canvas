import { supabase } from '@/integrations/supabase/client';

export async function resetUserPassword(userId: string, newPassword: string) {
  // Atualiza a senha do usuário no Supabase Auth
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) throw error;
}

export async function addPasswordHistory(userId: string, password: string) {
  // Salva o hash da senha antiga no histórico
  await supabase.from('password_history').insert({
    user_id: userId,
    password_hash: password, // Em produção, salve o hash, não a senha em texto puro!
    changed_at: new Date().toISOString(),
  });
}

export async function getPasswordHistory(userId: string) {
  const { data, error } = await supabase
    .from('password_history')
    .select('*')
    .eq('user_id', userId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return data;
}
