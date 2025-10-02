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
  category: string
) {
  const client = new MailtrapClient({
    token: config.mailtrap_token,
  });
  try {
    await client.batchSend({
      from: sender,
      to: recipients,
      subject,
      html,
      category,
    });
  } catch (error) {
    throw error;
  }
}
