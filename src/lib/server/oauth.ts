import { auth } from './lucia';
import { appEnv } from './env';
import { amazon, google, microsoftEntraId } from '@lucia-auth/oauth/providers';

export const googleAuth = google(auth, {
  clientId: appEnv.GOOGLE_CLIENT_ID,
  clientSecret: appEnv.GOOGLE_CLIENT_SECRET,
  redirectUri: `${appEnv.BASE_URL}/oauth/google/callback`
});

export const microsoftAuth = microsoftEntraId(auth, {
  clientId: appEnv.MICROSOFT_CLIENT_ID,
  clientSecret: appEnv.MICROSOFT_CLIENT_SECRET,
  redirectUri: `${appEnv.BASE_URL}/oauth/microsoft/callback`
});

export const amazonAuth = amazon(auth, {
  clientId: appEnv.AMAZON_CLIENT_ID,
  clientSecret: appEnv.AMAZON_CLIENT_SECRET,
  redirectUri: `${appEnv.BASE_URL}/oauth/amazon/callback`
});
