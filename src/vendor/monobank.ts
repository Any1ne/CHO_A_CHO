export async function createInvoiceOnServer(orderId: string, amount: number, redirectUrl: string): Promise<{paymentUrl: string, invoiceId: string}> {
  const fullRedirectUrl = `${redirectUrl}?orderId=${orderId}`;

  const webHookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/monobank/webhook`; // обов'язково HTTPS!

  const response = await fetch('/api/payment/monobank/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      amount,
      redirectUrl: fullRedirectUrl,
      webHookUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Помилка при створенні рахунку');
  }

  return data;
}