import { MailtrapClient } from "mailtrap";
const config = useRuntimeConfig();

const client = new MailtrapClient({
  token: config.mailtrap_token,
});

export async function sendEmail(
  sender: { email: string; name: string },
  to: string,
  subject: string,
  html: string,
  category: string
) {
  try {
    await client.send({
      from: sender, // Ganti dengan nama pengirim dan email
      to: [{ email: to }], // Ganti dengan alamat email penerima
      subject,
      html,
      category,
    });
    return true;
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
  const client = new MailtrapClient({
    token: config.mailtrap_token,
  });
  try {
    await client.batchSend({
      requests: recipients.map((recipient) => ({
        to: [{ email: recipient.email }],
        subject,
        html,
        category,
      })),
      base: {
        from: sender,
        template_uuid,
      },
    });
  } catch (error) {
    throw error;
  }
}
