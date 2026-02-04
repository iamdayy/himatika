import { Resend } from "resend";
const config = useRuntimeConfig();

const resend = new Resend(config.resend_api_key);

export async function sendEmail(
  sender: { email: string; name: string },
  to: string,
  subject: string,
  html: string,
  category: string
) {
  try {
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
    // Resend supports batch sending, but for simplicity and similar API to Mailtrap,
    // we can iterate or use batch if the list is small (max 100 per batch).
    // For now, let's just loop or use batch logic if appropriate.
    // Given the previous code used batchSend, let's use resend.batch.send [Note: SDK might be 'emails.send' with array, or 'batch.send']
    // Resend 'emails.send' 'to' field accepts array of strings, but that sends ONE email to MULTIPLE people (CC/BCC effect or individual? Resend sends individual if Bcc, but for To it might be one email).
    // Actually Resend batch API is `resend.batch.send` (POST /emails/batch).
    // Let's implement batch sending.

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

     // Resend batch limit is 100. If more, we need to chunk.
    const chunkSize = 100;
    for (let i = 0; i < batch.length; i += chunkSize) {
        const chunk = batch.slice(i, i + chunkSize);
        await resend.batch.send(chunk);
    }

  } catch (error) {
    throw error;
  }
}
