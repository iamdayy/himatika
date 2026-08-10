import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    const config = useRuntimeConfig();
    resendInstance = new Resend(config.resend_api_key as string);
  }
  return resendInstance;
}

export async function sendEmail(
  sender: { email: string; name: string },
  to: string,
  subject: string,
  html: string,
  category: string
) {
  try {
    const config = useRuntimeConfig();
    const resend = getResend();
    const data = await resend.emails.send({
      from: `${sender.name} <${config.resend_from}>`,
      to: [to],
      subject,
      html,
      tags: [
        {
          name: "category",
          value: category.replace(" ", "_").toLocaleLowerCase(),
        },
      ],
    });
    return data;
  } catch (error) {
    throw error;
  }
}

export async function sendBulkEmail(
  sender: { email: string; name: string },
  recipients: { email: string }[],
  subject: string,
  html: string,
  category: string,
  template_uuid: string
) {
  try {
    const config = useRuntimeConfig();
    const resend = getResend();
    
    const batch = recipients.filter((recipient) => recipient.email).map((recipient) => ({
      from: `${sender.name} <${config.resend_from}>`,
      to: [recipient.email],
      subject,
      html,
      tags: [
        {
          name: "category",
          value: category.replace(" ", "_").toLocaleLowerCase(),
        },
      ],
    }));

    const chunkSize = 100;
    for (let i = 0; i < batch.length; i += chunkSize) {
        const chunk = batch.slice(i, i + chunkSize);
        await resend.batch.send(chunk);
    }

  } catch (error) {
    throw error;
  }
}

