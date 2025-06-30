import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiToken = process.env.MONOBANK_API_TOKEN;

  if (!apiToken) {
    return NextResponse.json({ error: "Monobank API token missing" }, { status: 500 });
  }

  const { orderId, redirectUrl, } = await request.json(); //amount,

  try {

    console.log("--MONOBANK INVOICE", apiToken)
    const res = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
      method: "POST",
      headers: {
        "X-Token": apiToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 200, //Math.round(amount * 100), // копійки
        ccy: 980, // UAH
        redirectUrl,
        reference: orderId,
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: text }, { status: 500 });
    }

    const data = JSON.parse(text);
    return NextResponse.json({ paymentUrl: data.pageUrl, invoiceId: data.invoiceId });
  } catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Невідома помилка";
  return NextResponse.json({ error: message }, { status: 500 });
}

}
