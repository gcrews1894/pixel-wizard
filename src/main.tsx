import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider }  from './context/AuthContext';
import { AuthGuard }     from './components/AuthGuard';
import { LandingPage }   from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage }    from './pages/EditorPage';
import { AuthPage }      from './pages/AuthPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/app"        element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/editor/:id" element={<AuthGuard><EditorPage /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
