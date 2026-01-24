import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { SignageDisplay } from './components/signage/SignageDisplay';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PlayersManager } from './components/admin/PlayersManager';
import { SessionsManager } from './components/admin/SessionsManager';
import { ContentManager } from './components/admin/ContentManager';
import { ProtectedRoute, POST_LOGIN_PATH_KEY } from './components/auth/ProtectedRoute';
import { Unauthorized } from './components/auth/Unauthorized';

function AppRoutes() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const pendingPath = sessionStorage.getItem(POST_LOGIN_PATH_KEY);
    if (pendingPath && pendingPath !== location.pathname) {
      sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
      navigate(pendingPath, { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<SignageDisplay />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/players"
        element={
          <ProtectedRoute>
            <PlayersManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions"
        element={
          <ProtectedRoute>
            <SessionsManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content"
        element={
          <ProtectedRoute>
            <ContentManager />
          </ProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
