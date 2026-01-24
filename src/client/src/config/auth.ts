import type { Configuration, RedirectRequest } from '@azure/msal-browser';

type RequiredEnvKey =
  | 'VITE_AZURE_AUTHORITY'
  | 'VITE_AZURE_CLIENT_ID'
  | 'VITE_AZURE_REDIRECTS'
  | 'VITE_AZURE_REQUIRED_CLAIM'
  | 'VITE_AZURE_REQUIRED_CLAIM_VALUE';

type RedirectSettings = {
  origin: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
};

const env = import.meta.env as Record<string, string | undefined>;

function requireEnvVar(key: RequiredEnvKey): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} environment variable is required for authentication configuration.`);
  }
  return value;
}

function parseRedirectSettings(): RedirectSettings[] {
  const rawValue = requireEnvVar('VITE_AZURE_REDIRECTS');
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`VITE_AZURE_REDIRECTS must be valid JSON. ${(error as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new TypeError('VITE_AZURE_REDIRECTS must be a JSON array of redirect settings.');
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`VITE_AZURE_REDIRECTS entry ${index} must be an object.`);
    }

    const { origin, redirectUri, postLogoutRedirectUri } = entry as Record<string, unknown>;

    if (typeof origin !== 'string' || origin.length === 0) {
      throw new Error(`VITE_AZURE_REDIRECTS entry ${index} must specify a non-empty origin.`);
    }
    if (typeof redirectUri !== 'string' || redirectUri.length === 0) {
      throw new Error(`VITE_AZURE_REDIRECTS entry ${index} must specify redirectUri.`);
    }
    if (typeof postLogoutRedirectUri !== 'string' || postLogoutRedirectUri.length === 0) {
      throw new Error(`VITE_AZURE_REDIRECTS entry ${index} must specify postLogoutRedirectUri.`);
    }

    return {
      origin,
      redirectUri,
      postLogoutRedirectUri,
    } satisfies RedirectSettings;
  });
}

const authority = requireEnvVar('VITE_AZURE_AUTHORITY');
const clientId = requireEnvVar('VITE_AZURE_CLIENT_ID');
const redirects = parseRedirectSettings();
const apiScope = env.VITE_AZURE_API_SCOPE;

const requiredClaimName = requireEnvVar('VITE_AZURE_REQUIRED_CLAIM');
const requiredClaimValue = requireEnvVar('VITE_AZURE_REQUIRED_CLAIM_VALUE');

let hostname: string | undefined;

try {
  hostname = new URL(authority).hostname;
  if (!hostname) {
    throw new Error('Authority URL must include a hostname.');
  }
} catch (error) {
  throw new Error(`VITE_AZURE_AUTHORITY must be a valid URL. ${(error as Error).message}`);
}

const browserWindow = (globalThis as typeof globalThis & { window?: Window }).window;
const origin = browserWindow?.location.origin;

if (origin === undefined) {
  throw new Error('window.location.origin is required to resolve redirect URIs.');
}

const redirectConfig = redirects.find((entry) => entry.origin === origin);

if (redirectConfig === undefined) {
  throw new Error(`VITE_AZURE_REDIRECTS does not contain an entry for origin ${origin}.`);
}

const { redirectUri, postLogoutRedirectUri } = redirectConfig;

export const msalConfig: Configuration = {
  auth: {
    authority,
    clientId,
    redirectUri,
    postLogoutRedirectUri,
    knownAuthorities: hostname ? [hostname] : undefined,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
  },
};

const baseScopes = ['openid', 'profile', 'email'];

export const loginRequest: RedirectRequest = {
  scopes: apiScope ? [...baseScopes, apiScope] : baseScopes,
};

export const requiredClaim = {
  name: requiredClaimName,
  value: requiredClaimValue,
};
