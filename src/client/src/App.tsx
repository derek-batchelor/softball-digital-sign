import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignageDisplay } from './components/signage/SignageDisplay';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PlayersManager } from './components/admin/PlayersManager';
import { SessionsManager } from './components/admin/SessionsManager';
import { ContentManager } from './components/admin/ContentManager';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignageDisplay />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/players" element={<PlayersManager />} />
        <Route path="/admin/sessions" element={<SessionsManager />} />
        <Route path="/admin/content" element={<ContentManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
