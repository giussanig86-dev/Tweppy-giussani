import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../auth/useAuth';

const NAV_ITEMS = [
  { to: '/anagrafica', label: 'Anagrafica' },
  { to: '/documenti', label: 'Documenti' },
  { to: '/ocr', label: 'OCR' },
  { to: '/workflow', label: 'Workflow' },
  { to: '/parcellazione', label: 'Parcellazione' },
];

const QUICK_CREATE = [
  { label: '✉️  Nuova comunicazione', to: '/comunicazioni' },
  { label: '📅  Nuovo evento calendario', to: '/calendario' },
  { label: '👤  Nuova anagrafica', to: '/anagrafica' },
];

export default function Shell({ children }) {
  const { account, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleQuickCreate(to) {
    setMenuOpen(false);
    navigate(to, { state: { openNew: true } });
  }

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
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                title="Crea nuovo..."
                className="w-8 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow transition"
              >
                +
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-lg border py-1 z-50">
                  {QUICK_CREATE.map(item => (
                    <button
                      key={item.to}
                      onClick={() => handleQuickCreate(item.to)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
