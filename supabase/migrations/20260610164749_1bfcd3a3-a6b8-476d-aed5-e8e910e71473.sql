DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.raffle_reservations;

CREATE POLICY "Users can view their own reservations"
ON public.raffle_reservations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations"
ON public.raffle_reservations
FOR SELECT
TO authenticated
USING (public.is_admin_user());