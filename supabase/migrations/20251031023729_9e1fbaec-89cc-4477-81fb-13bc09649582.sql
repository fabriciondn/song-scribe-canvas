-- Adicionar política para admins visualizarem todas as conversões de afiliados
CREATE POLICY "Admins can view all affiliate conversions"
  ON affiliate_conversions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Adicionar política para admins visualizarem todas as comissões
CREATE POLICY "Admins can view all affiliate commissions for management"
  ON affiliate_commissions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Adicionar política para admins visualizarem autor_registrations de todos
CREATE POLICY "Admins can view all author registrations"
  ON author_registrations
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );