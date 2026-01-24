import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../config/auth';

export const msalInstance = new PublicClientApplication(msalConfig);
