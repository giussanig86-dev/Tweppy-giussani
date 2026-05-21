import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import Shell from './components/layout/Shell';
import LoginPage from './pages/LoginPage';
import AnagraficaPage from './modules/anagrafica/AnagraficaPage';
import TasksPage from './modules/tasks/TasksPage';
import OcrPage from './modules/ocr/OcrPage';
import ChecklistPage from './modules/checklist/ChecklistPage';
import DocumentiPage from './modules/documenti/DocumentiPage';
import TemplatesPage from './modules/templates/TemplatesPage';
import CalendarioPage from './modules/calendario/CalendarioPage';
import ComunicazioniPage from './modules/comunicazioni/ComunicazioniPage';
import WorkflowPage from './modules/workflow/WorkflowPage';
import ParcellazionePage from './modules/parcellazione/ParcellazionePage';
import OutlookAddinPage from './pages/OutlookAddinPage';
import { NotificheProvider } from './context/NotificheContext';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

function ProtectedRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();
  return (DEMO || isAuthenticated) ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/outlook" element={<OutlookAddinPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <NotificheProvider>
              <Shell>
                <Routes>
                  <Route path="/" element={<Navigate to="/anagrafica" replace />} />
                  <Route path="/anagrafica" element={<AnagraficaPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/ocr" element={<OcrPage />} />
                  <Route path="/checklist" element={<ChecklistPage />} />
                  <Route path="/documenti" element={<DocumentiPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/calendario" element={<CalendarioPage />} />
                  <Route path="/comunicazioni" element={<ComunicazioniPage />} />
                  <Route path="/workflow" element={<WorkflowPage />} />
                  <Route path="/parcellazione" element={<ParcellazionePage />} />
                </Routes>
              </Shell>
              </NotificheProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
