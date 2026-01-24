import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { loginRequest, requiredClaim } from '../../config/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const POST_LOGIN_PATH_KEY = 'postLoginPath';

function decodeJwt(token: string): Record<string, unknown> | undefined {
  try {
    const segments = token.split('.');
    if (segments.length < 2) {
      return undefined;
    }

    const base64Url = segments[1];
    const base64 = base64Url.split('-').join('+').split('_').join('/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(paddedBase64);

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (error) {
    console.error('Failed to decode JWT payload', error);
    return undefined;
  }
}

function hasRequiredClaim(claims: Record<string, unknown> | undefined): boolean {
  if (!claims) {
    return false;
  }

  const claimValue = claims[requiredClaim.name];

  if (Array.isArray(claimValue)) {
    return claimValue.includes(requiredClaim.value);
  }

  if (typeof claimValue === 'boolean') {
    return String(claimValue) === requiredClaim.value;
  }

  if (typeof claimValue === 'string' || typeof claimValue === 'number') {
    return String(claimValue) === requiredClaim.value;
  }

  return false;
}

export function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  const location = useLocation();
  const { instance, accounts, inProgress } = useMsal();
  const [loginInitiated, setLoginInitiated] = useState(false);
  const [accessTokenClaimSatisfied, setAccessTokenClaimSatisfied] = useState(false);
  const [claimEvaluationComplete, setClaimEvaluationComplete] = useState(false);

  const activeAccount = useMemo(() => accounts[0], [accounts]);
  const isAuthenticated = Boolean(activeAccount);
  const activeAccountId = activeAccount?.homeAccountId;
  const idTokenClaimSatisfied = useMemo(
    () => hasRequiredClaim(activeAccount?.idTokenClaims as Record<string, unknown> | undefined),
    [activeAccount],
  );
  const claimSatisfied =
    idTokenClaimSatisfied || (claimEvaluationComplete && accessTokenClaimSatisfied);

  useEffect(() => {
    if (activeAccount) {
      instance.setActiveAccount(activeAccount);
    }
  }, [activeAccount, instance]);

  useEffect(() => {
    if (!isAuthenticated && inProgress === InteractionStatus.None && !loginInitiated) {
      sessionStorage.setItem(POST_LOGIN_PATH_KEY, location.pathname + location.search);
      setLoginInitiated(true);
      instance.loginRedirect(loginRequest).catch((error: unknown) => {
        console.error('Login redirect failed', error);
        setLoginInitiated(false);
      });
    }
  }, [isAuthenticated, inProgress, instance, loginInitiated, location.pathname, location.search]);

  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAccessTokenClaimSatisfied(false);
      setClaimEvaluationComplete(false);
      return;
    }

    if (idTokenClaimSatisfied) {
      setAccessTokenClaimSatisfied(true);
      setClaimEvaluationComplete(true);
      return;
    }

    setClaimEvaluationComplete(false);
    let cancelled = false;

    instance
      .acquireTokenSilent(loginRequest)
      .then((result) => {
        if (cancelled) {
          return;
        }

        const claims = decodeJwt(result.accessToken);
        setAccessTokenClaimSatisfied(hasRequiredClaim(claims));
        setClaimEvaluationComplete(true);
      })
      .catch((error) => {
        console.error('Failed to acquire access token for claim evaluation', error);
        if (!cancelled) {
          setAccessTokenClaimSatisfied(false);
          setClaimEvaluationComplete(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [instance, isAuthenticated, activeAccountId, idTokenClaimSatisfied]);

  if (
    inProgress === InteractionStatus.Login ||
    inProgress === InteractionStatus.SsoSilent ||
    inProgress === InteractionStatus.HandleRedirect
  ) {
    return (
      <div className="flex h-screen items-center justify-center text-lg text-gray-700">
        Completing sign-in…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center text-lg text-gray-700">
        Redirecting to sign-in…
      </div>
    );
  }

  if (!idTokenClaimSatisfied && !claimEvaluationComplete) {
    return (
      <div className="flex h-screen items-center justify-center text-lg text-gray-700">
        Checking access…
      </div>
    );
  }

  if (!claimSatisfied) {
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
