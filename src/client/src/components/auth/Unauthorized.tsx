import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { requiredClaim } from '../../config/auth';

export function Unauthorized() {
  const location = useLocation();
  const { instance } = useMsal();

  const fromPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from;
  }, [location.state]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-8 text-center text-slate-800">
      <div className="max-w-lg space-y-2">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p>
          Your account does not include the required claim {requiredClaim.name} with value{' '}
          {requiredClaim.value}. Please contact an administrator to request access.
        </p>
        {fromPath ? <p className="text-sm text-slate-600">Attempted to reach: {fromPath}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500"
          onClick={() => instance.logoutRedirect()}
        >
          Switch account
        </button>
        <Link
          className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          to="/"
        >
          Back to display
        </Link>
      </div>
    </div>
  );
}
