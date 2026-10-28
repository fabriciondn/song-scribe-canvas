export async function verifyAbacatePix(paymentId: string) {
  const key = Deno.env.get('ABACATE_API_KEY');
  if (!key) throw new Error('ABACATE_API_KEY not configured');
  const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${encodeURIComponent(paymentId)}`, {
    headers: {Authorization: `Bearer ${key}`},
  });
  if (!response.ok) throw new Error('Unable to verify Abacate payment');
  const result = await response.json();
  if (result.error) throw new Error('Unable to verify Abacate payment');
  return result.data?.status === 'PAID';
}