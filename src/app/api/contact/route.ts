import { NextResponse } from "next/server";
import { sendContactRequestEmail } from "@/lib/email/email";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Всі поля обовʼязкові" }, { status: 400 });
    }

    await sendContactRequestEmail(name, email, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔴 Contact form email error:", error);
    return NextResponse.json(
      { error: "Не вдалося надіслати повідомлення" },
      { status: 500 }
    );
  }
}
