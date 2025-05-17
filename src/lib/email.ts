import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

