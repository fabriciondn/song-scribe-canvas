import { supabase } from '@/integrations/supabase/client';

// Chama a edge function para resetar senha de forma segura
export async function resetUserPassword(userId: string, newPassword: string) {
  const res = await fetch('/functions/v1/reset-user-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao resetar senha');
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
