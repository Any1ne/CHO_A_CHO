import { Resend } from 'resend';
import { generateContactEmailHtml } from "@/lib/email/generateEmailHtml"; 

const resend = new Resend(process.env.RESEND_API_KEY);
// або іншого відповідного файлу

export const sendOrderConfirmation = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const response = await resend.emails.send({
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

export async function sendContactRequestEmail(name: string, email: string, message: string) {
const html = generateContactEmailHtml(name, email, message);

  const response = await resend.emails.send({
    from: `CHO A CHO Shop <${process.env.SEND_EMAIL}>`,
    to: [process.env.ADMIN_EMAIL || ""],
    subject: "Новий запит з контактної форми",
    html,
  });

  if (response.error) {
    throw new Error(`Email error: ${response.error.message}`);
  }

  return response;
}
