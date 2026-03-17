import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { LandingPage }  from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage }   from './pages/EditorPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/app"        element={<DashboardPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
