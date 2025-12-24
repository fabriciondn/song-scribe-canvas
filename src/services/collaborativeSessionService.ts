import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

export interface CollaborativeSession {
  id: string;
  host_user_id: string;
  session_token: string;
  draft_id: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  updated_at: string;
}

export interface CollaborativeParticipant {
  id: string;
  session_id: string;
  user_id: string;
  is_online: boolean;
  last_activity: string;
  joined_at: string;
  profile?: {
    name: string | null;
    artistic_name: string | null;
    avatar_url: string | null;
  };
}

// Gerar token único para sessão colaborativa
const generateSessionToken = (): string => {
  return `COLLAB-${nanoid(12)}`;
};

// Criar uma nova sessão colaborativa
export const createCollaborativeSession = async (draftId: string): Promise<CollaborativeSession> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24 horas

  const { data, error } = await supabase
    .from('collaborative_sessions')
    .insert({
      host_user_id: user.id,
      session_token: sessionToken,
      draft_id: draftId,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  // Adicionar o host como participante
  await supabase.from('collaborative_participants').insert({
    session_id: data.id,
    user_id: user.id,
    is_online: true
  });

  return data as CollaborativeSession;
};

// Buscar sessão por token
export const getSessionByToken = async (token: string): Promise<CollaborativeSession | null> => {
  const { data, error } = await supabase
    .from('collaborative_sessions')
    .select('*')
    .eq('session_token', token)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as CollaborativeSession;
};

// Entrar em uma sessão colaborativa
export const joinSession = async (token: string): Promise<{ session: CollaborativeSession; draftId: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const session = await getSessionByToken(token);
  if (!session) throw new Error('Sessão não encontrada ou expirada');

  // Verificar se já é participante
  const { data: existingParticipant } = await supabase
    .from('collaborative_participants')
    .select()
    .eq('session_id', session.id)
    .eq('user_id', user.id)
    .single();

  if (!existingParticipant) {
    // Adicionar como novo participante
    await supabase.from('collaborative_participants').insert({
      session_id: session.id,
      user_id: user.id,
      is_online: true
    });
  } else {
    // Atualizar status para online
    await supabase
      .from('collaborative_participants')
      .update({ is_online: true, last_activity: new Date().toISOString() })
      .eq('id', existingParticipant.id);
  }

  return { session, draftId: session.draft_id };
};

// Sair de uma sessão
export const leaveSession = async (sessionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  await supabase
    .from('collaborative_participants')
    .update({ is_online: false })
    .eq('session_id', sessionId)
    .eq('user_id', user.id);
};

// Atualizar atividade do participante
export const updateParticipantActivity = async (sessionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('collaborative_participants')
    .update({ last_activity: new Date().toISOString(), is_online: true })
    .eq('session_id', sessionId)
    .eq('user_id', user.id);
};

// Buscar participantes de uma sessão
export const getSessionParticipants = async (sessionId: string): Promise<CollaborativeParticipant[]> => {
  const { data: participants, error } = await supabase
    .from('collaborative_participants')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw error;

  // Buscar perfis dos participantes
  const userIds = participants.map(p => p.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, artistic_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return participants.map(p => ({
    ...p,
    profile: profileMap.get(p.user_id) || null
  })) as CollaborativeParticipant[];
};

// Encerrar uma sessão (apenas host)
export const endSession = async (sessionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('collaborative_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)
    .eq('host_user_id', user.id);

  if (error) throw error;
};

// Buscar sessão ativa para um rascunho
export const getActiveSessionForDraft = async (draftId: string): Promise<CollaborativeSession | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('collaborative_sessions')
    .select('*')
    .eq('draft_id', draftId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as CollaborativeSession;
};

// Buscar sessões ativas do usuário (como host ou participante)
export const getUserActiveSessions = async (): Promise<CollaborativeSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Buscar sessões onde é host
  const { data: hostSessions } = await supabase
    .from('collaborative_sessions')
    .select('*')
    .eq('host_user_id', user.id)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());

  // Buscar sessões onde é participante
  const { data: participantData } = await supabase
    .from('collaborative_participants')
    .select('session_id')
    .eq('user_id', user.id);

  const participantSessionIds = participantData?.map(p => p.session_id) || [];

  let participantSessions: CollaborativeSession[] = [];
  if (participantSessionIds.length > 0) {
    const { data } = await supabase
      .from('collaborative_sessions')
      .select('*')
      .in('id', participantSessionIds)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());
    
    participantSessions = (data || []) as CollaborativeSession[];
  }

  // Combinar e remover duplicatas
  const allSessions = [...(hostSessions || []), ...participantSessions];
  const uniqueSessions = allSessions.filter((session, index, self) =>
    index === self.findIndex(s => s.id === session.id)
  );

  return uniqueSessions as CollaborativeSession[];
};
