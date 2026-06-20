(globalThis as any).useRuntimeConfig = () => ({
  resend_api_key: process.env.RESEND_API_KEY || "mock-key",
  resend_from: process.env.RESEND_FROM || "mock-from",
  mongodb_uri: process.env.HIMATIKA_MONGODB_URI,
});
