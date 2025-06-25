import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Всі поля обовʼязкові" }, { status: 400 });
    }

    const html = `
      <h2>Новий запит з форми зворотного звʼязку</h2>
      <p><strong>Імʼя:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Повідомлення:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    const response = await resend.emails.send({
  from: `CHO A CHO Shop <${process.env.SEND_EMAIL}>`,
  to: [`${process.env.ADMIN_EMAIL}`],
  subject: "Новий запит з контактної форми",
  html,
});

if (response.error) {
  console.error("Email error:", response.error);
  return NextResponse.json({ error: "Не вдалося надіслати email" }, { status: 500 });
}


    return NextResponse.json({ success: true});
  } catch (error) {
    console.error("🔴 Contact form email error:", error);
    return NextResponse.json({ error: "Не вдалося надіслати повідомлення" }, { status: 500 });
  }
}
