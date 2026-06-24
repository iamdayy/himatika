export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  return cleaned + "@c.us";
};

export const sendWhatsappMessage = async (phone: string, text: string) => {
  const config = useRuntimeConfig();
  const url = config.wahaUrl as string;
  const session = (config.wahaSession as string) || "default";
  const apiKey = config.wahaApiKey as string;

  if (!url || !apiKey) {
    console.error("[WAHA] URL or API Key is missing in runtimeConfig");
    return;
  }

  const chatId = formatPhoneNumber(phone);

  try {
    const response = await $fetch(`${url}/api/sendText`, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: {
        session: session,
        chatId: chatId,
        text: text,
      },
    });
    return response;
  } catch (error) {
    console.error("[WAHA] Failed to send message:", error);
  }
};

export const sendWhatsappFile = async (
  phone: string,
  fileUrl: string,
  fileName: string,
  mimetype: string,
  caption?: string
) => {
  const config = useRuntimeConfig();
  const url = config.wahaUrl as string;
  const session = (config.wahaSession as string) || "default";
  const apiKey = config.wahaApiKey as string;

  if (!url || !apiKey) {
    console.error("[WAHA] URL or API Key is missing in runtimeConfig");
    return;
  }

  const chatId = formatPhoneNumber(phone);

  const fileObj: any = {
    mimetype: mimetype,
    filename: fileName,
  };

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    fileObj.url = fileUrl;
  } else {
    // Treat as base64 data
    if (fileUrl.startsWith("data:")) {
      fileObj.data = fileUrl.split(",")[1];
    } else {
      fileObj.data = fileUrl;
    }
  }

  try {
    const response = await $fetch(`${url}/api/sendFile`, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: {
        session: session,
        chatId: chatId,
        file: fileObj,
        caption: caption,
      },
    });
    return response;
  } catch (error) {
    console.error("[WAHA] Failed to send file:", error);
  }
};
