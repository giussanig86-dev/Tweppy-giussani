import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/tasks', label: 'Task' },
  { to: '/comunicazioni', label: 'Comunicazioni' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/checklist', label: 'Scadenze Fiscali' },
  { to: '/templates', label: 'Template' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-brand-900 text-white flex flex-col py-6">
      <div className="px-6 mb-8">
        <span className="text-xl font-bold tracking-tight">GDS Studio</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
