
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export const getGoogleAuthUrl = (redirectUri: string) => {
  const config = useRuntimeConfig();
  if (!config.googleClientId) {
    throw new Error('Google Client ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const getGoogleUser = async (code: string, redirectUri: string): Promise<GoogleUser> => {
  const config = useRuntimeConfig();
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new Error('Google Client ID or Secret is not configured');
  }

  try {
    const tokenResponse = await $fetch<GoogleTokenResponse>(GOOGLE_TOKEN_URL, {
      method: 'POST',
      body: {
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
    });

    const userResponse = await $fetch<GoogleUser>(GOOGLE_USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

    return userResponse;
  } catch (error) {
    console.error('Error fetching Google user:', error);
    throw createError({
      statusCode: 401,
      statusMessage: 'Failed to authenticate with Google',
    });
  }
};
