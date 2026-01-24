import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '../auth/msalInstance';
import { loginRequest } from '../config/auth';

export async function acquireAuthToken(): Promise<string | null> {
  const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];

  if (!account) {
    return null;
  }

  try {
    const result = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    if (result.accessToken) {
      return result.accessToken;
    }

    return result.idToken ?? null;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(loginRequest);
    } else {
      console.error('Failed to acquire token silently', error);
    }

    return null;
  }
}
