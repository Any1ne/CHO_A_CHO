// src/lib/email/email.ts
import { Resend } from "resend";
import { generateContactEmailHtml } from "@/lib/email/generateEmailHtml";

const LOCAL_MODE = process.env.LOCAL_MODE === "true";

// Ініціалізація клієнта тільки якщо не локально і є ключ
let resendClient: Resend | null = null;
if (!LOCAL_MODE) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — email sending disabled");
  } else {
    try {
      resendClient = new Resend(key);
    } catch (err) {
      console.error("[email] Failed to init Resend client:", err);
      resendClient = null;
    }
  }
}

export const sendOrderConfirmation = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (LOCAL_MODE) {
    console.log("[email] LOCAL_MODE=true — skipping sendOrderConfirmation", { to, subject });
    return { ok: true, local: true };
  }

  if (!resendClient) {
    console.warn("[email] Resend client not configured — skipping email send", { to });
    return { ok: false, error: "Resend not configured" };
  }

  try {
    const response = await resendClient.emails.send({
      from: `CHO A CHO Shop <${process.env.SEND_EMAIL}>`,
      to,
      subject,
      html,
    });

    return response;
  } catch (error) {
    console.error("🔴 Email error:", error);
    throw error;
  }
};

export const sendContactRequestEmail = async (name: string, email: string, message: string) => {
  const html = generateContactEmailHtml(name, email, message);

  if (LOCAL_MODE) {
    console.log("[email] LOCAL_MODE=true — skipping sendContactRequestEmail", { name, email });
    return { ok: true, local: true };
  }

  if (!resendClient) {
    console.warn("[email] Resend client not configured — skipping contact email");
    return { ok: false, error: "Resend not configured" };
  }

  const response = await resendClient.emails.send({
    from: `CHO A CHO Shop <${process.env.SEND_EMAIL}>`,
    to: [process.env.ADMIN_EMAIL || ""],
    subject: "Новий запит з контактної форми",
    html,
  });

  if ((response as any).error) {
    console.error("Email sending error object:", (response as any).error);
    throw new Error(`Email error: ${JSON.stringify((response as any).error)}`);
  }

  return response;
};
