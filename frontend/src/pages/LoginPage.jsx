import { useIsAuthenticated } from '@azure/msal-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function LoginPage() {
  const isAuthenticated = useIsAuthenticated();
  const { login } = useAuth();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Velia GDS</h1>
        <p className="text-gray-500 mb-8 text-sm">Gestione Studio Tributario</p>
        <button
          onClick={login}
          className="w-full bg-brand-500 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Accedi con Microsoft 365
        </button>
      </div>
    </div>
  );
}
