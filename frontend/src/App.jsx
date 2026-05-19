import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import Shell from './components/layout/Shell';
import LoginPage from './pages/LoginPage';
import AnagraficaPage from './modules/anagrafica/AnagraficaPage';

function ProtectedRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Shell>
                <Routes>
                  <Route path="/" element={<Navigate to="/anagrafica" replace />} />
                  <Route path="/anagrafica" element={<AnagraficaPage />} />
                </Routes>
              </Shell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
