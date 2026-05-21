import { NavLink } from 'react-router-dom';
import { useNotifiche } from '../../context/NotificheContext';

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Sidebar() {
  const { taskCount, emailCount } = useNotifiche();

  const navItems = [
    { to: '/tasks',         label: 'Task',           badge: taskCount },
    { to: '/comunicazioni', label: 'Comunicazioni',  badge: emailCount },
    { to: '/calendario',    label: 'Calendario',     badge: 0 },
    { to: '/checklist',     label: 'Scadenze Fiscali', badge: 0 },
    { to: '/templates',     label: 'Template',       badge: 0 },
  ];

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
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.label}
            <Badge count={item.badge} />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
