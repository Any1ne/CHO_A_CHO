export async function createInvoiceOnServer(orderId: string, redirectUrl: string): Promise<{paymentUrl: string, invoiceId: string}> {
  const fullRedirectUrl = `${redirectUrl}?orderId=${orderId}`;

  // Amount, basket and webhook URL are built server-side from the Redis order.
  const response = await fetch('/api/payment/monobank/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      redirectUrl: fullRedirectUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Помилка при створенні рахунку');
  }

  return data;
}
