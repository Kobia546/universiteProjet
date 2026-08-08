import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-24 items-center justify-center gap-3 border-b border-slate-100 bg-teal-50 px-3">
        <img
          src="/logos/universite.png"
          alt="Université Félix Houphouët-Boigny"
          className="h-20 w-20 shrink-0 object-contain"
        />

        <span className="flex items-center justify-center gap-2 text-center font-serif text-[14px] font-semibold leading-tight text-slate-900">
          <span className="whitespace-nowrap">SYFIC - SJAP</span>
          <img src="/logos/ufr-sjap.jpg" alt="UFR SJAP" className="h-[60px] w-[60px] shrink-0 object-contain" />
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3 pt-2 bg-teal-50">
        {navItems.map(({ to, label, icon: Icon, end, accentActifClassName, accentSurvolClassName }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? accentActifClassName : `text-slate-600 hover:text-slate-900 ${accentSurvolClassName}`
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 bg-teal-50 p-2">
        <div className="flex items-center justify-start rounded-lg border border-dashed border-slate-200 px-3 py-2">
          <img
            src="/logos/proprietaire.png"
            alt="Logo propriétaire"
            className="h-8 max-w-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </aside>
  );
}
