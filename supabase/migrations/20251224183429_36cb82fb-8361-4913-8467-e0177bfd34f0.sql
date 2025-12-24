-- Remover políticas antigas que causam recursão infinita
DROP POLICY IF EXISTS "Host can manage own sessions" ON collaborative_sessions;
DROP POLICY IF EXISTS "Participants can view session" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can manage own participation" ON collaborative_participants;
DROP POLICY IF EXISTS "Session participants can view each other" ON collaborative_participants;

-- Criar políticas simples sem recursão
-- Sessions: usuários autenticados podem criar e ver sessões
CREATE POLICY "Users can create sessions"
  ON collaborative_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Users can view sessions"
  ON collaborative_sessions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Host can update own sessions"
  ON collaborative_sessions
  FOR UPDATE
  USING (auth.uid() = host_user_id);

CREATE POLICY "Host can delete own sessions"
  ON collaborative_sessions
  FOR DELETE
  USING (auth.uid() = host_user_id);

-- Participants: usuários autenticados podem gerenciar participação
CREATE POLICY "Users can insert own participation"
  ON collaborative_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view participants"
  ON collaborative_participants
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participation"
  ON collaborative_participants
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own participation"
  ON collaborative_participants
  FOR DELETE
  USING (auth.uid() = user_id);