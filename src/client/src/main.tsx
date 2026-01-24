import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import './index.css';
import { msalInstance } from './auth/msalInstance';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);

  msalInstance
    .initialize()
    .then(() => {
      root.render(
        <React.StrictMode>
          <MsalProvider instance={msalInstance}>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </MsalProvider>
        </React.StrictMode>,
      );
    })
    .catch((error: unknown) => {
      console.error('Failed to initialise MSAL instance', error);
    });
}
