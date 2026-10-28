import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { z } from 'npm:zod@3';

export { LAUNCH_AMOUNT } from './launch-pricing.ts';
import { LAUNCH_AMOUNT } from './launch-pricing.ts';
export const LAUNCH_DESCRIPTION = 'Plano Padrão — Oferta de Lançamento: até 50 registros autorais por 30 dias, sem acúmulo';
export const paymentIdSchema = z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/);

export async function authenticatedUser(req: Request) {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
  const { data, error } = await client.auth.getUser(header.slice(7));
  if (error || !data.user) throw new Error('Unauthorized');
  return data.user;
}

export async function ensureLaunchPurchaseAllowed(client: any, userId: string) {
  const { data: sub, error } = await client.from('subscriptions').select('status,expires_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now())) {
    throw new Error('Sua assinatura atual permanece ativa; aguarde o fim do ciclo. Assinantes antigos precisam de migração explícita.');
  }
  // Never overwrite pending legacy payments. Their callbacks must still find the original record.
  if (sub?.status === 'pending') throw new Error('Existe um pagamento anterior pendente. Conclua ou cancele esse pagamento antes de contratar.');
}

export async function saveLaunchOrder(client: any, userId: string, provider: string, paymentId: string) {
  paymentIdSchema.parse(paymentId);
  const { data, error } = await client.from('subscription_launch_orders').insert({
    user_id: userId, provider, payment_id: paymentId, amount: LAUNCH_AMOUNT,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function activateLaunchPayment(client: any, provider: string, paymentId: string, amount: number, paidAt: string) {
  paymentIdSchema.parse(paymentId);
  if (amount !== LAUNCH_AMOUNT || !paidAt || !Number.isFinite(Date.parse(paidAt))) throw new Error('Payment amount or date mismatch');
  const { data, error } = await client.rpc('activate_launch_subscription', {
    p_provider: provider, p_payment_id: paymentId, p_amount: amount, p_paid_at: paidAt,
  });
  if (error || !data?.success) throw error || new Error('Subscription activation failed');
  return data;
}