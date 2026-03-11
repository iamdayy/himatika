import { getGoogleAuthUrl } from "~~/server/utils/googleAuth";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const redirectUri = `${config.public.public_uri}/api/auth/google/callback`;
  
  const authUrl = getGoogleAuthUrl(redirectUri);
  
  return sendRedirect(event, authUrl);
});
