import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navItems } from './navItems';

export function MobileNavDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panneau */}
      <aside
        className={`absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2">
            <img src="/logos/universite.png" alt="Université Félix Houphouët-Boigny" className="h-8 w-8 object-contain" />
            
            <span className="font-serif text-[10px] font-semibold text-slate-900">
              SYFIC - SJAP
              <img src="/logos/ufr-sjap.png" alt="UFR SJAP" className="h-8 w-8 object-contain" />
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon: Icon, end, accentActifClassName, accentSurvolClassName }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? accentActifClassName : `text-slate-600 hover:text-slate-900 ${accentSurvolClassName}`
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Zone réservée à la marque du propriétaire/développeur.
            Remplacez /logos/proprietaire.png par votre logo (même dossier public/logos). */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 px-3 py-2">
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
    </div>
  );
}
