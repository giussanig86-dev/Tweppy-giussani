import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../auth/useAuth';

const NAV_ITEMS = [
  { to: '/anagrafica', label: 'Anagrafica' },
  { to: '/documenti', label: 'Documenti' },
  { to: '/ocr', label: 'OCR' },
  { to: '/workflow', label: 'Workflow' },
  { to: '/parcellazione', label: 'Parcellazione' },
];

export default function Shell({ children }) {
  const { account, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{account?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-700 transition"
            >
              Esci
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
