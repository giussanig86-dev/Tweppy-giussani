import Sidebar from './Sidebar';
import { useAuth } from '../../auth/useAuth';

export default function Shell({ children }) {
  const { account, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b flex items-center justify-end px-6 gap-4">
          <span className="text-sm text-gray-600">{account?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-gray-700 transition"
          >
            Esci
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
