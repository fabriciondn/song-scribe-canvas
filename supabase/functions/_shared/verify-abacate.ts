export async function verifyAbacatePix(paymentId: string) {
  const key = Deno.env.get('ABACATE_API_KEY');
  if (!key) throw new Error('ABACATE_API_KEY not configured');
  const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${encodeURIComponent(paymentId)}`, {
    headers: {Authorization: `Bearer ${key}`},
  });
  if (response.ok) {
    const result = await response.json();
    if (!result.error && result.data?.status) return result.data.status === 'PAID';
  }
  // Older billing/create entrypoint has a different verification endpoint.
  const billingResponse = await fetch('https://api.abacatepay.com/v1/billing/list', {
    headers: {Authorization: `Bearer ${key}`},
  });
  if (!billingResponse.ok) throw new Error('Unable to verify Abacate payment');
  const result = await billingResponse.json();
  const billing = Array.isArray(result.data) ? result.data.find((item: {id: string}) => item.id === paymentId) : null;
  if (!billing) throw new Error('Unable to verify Abacate payment');
  if (billing.amount !== 9700) throw new Error('Payment amount mismatch');
  return billing.status === 'PAID';
}