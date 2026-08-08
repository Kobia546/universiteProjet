import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Wallet,
  BookOpen,
  Search,
  FileOutput,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /**
   * Classes Tailwind (écrites en toutes lettres pour que le JIT les
   * détecte) appliquées à l'état actif de ce lien — un fond et un liseré
   * de gauche très discrets, une teinte différente par menu pour repérer
   * plus vite où l'on se trouve dans la sidebar.
   */
  accentActifClassName: string;
  accentSurvolClassName: string;
}

export const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    end: true,
    accentActifClassName: 'bg-slate-300 text-slate-900 border-l-2 border-slate-400',
    accentSurvolClassName: 'hover:bg-slate-200/80',
  },
  {
    to: '/parametres',
    label: 'Administration',
    icon: Settings,
    accentActifClassName: 'bg-rose-200 text-rose-800 border-l-2 border-rose-300',
    accentSurvolClassName: 'hover:bg-rose-200/60',
  },
  {
    to: '/inscriptions',
    label: 'Inscriptions',
    icon: GraduationCap,
    accentActifClassName: 'bg-teal-200 text-teal-800 border-l-2 border-teal-300',
    accentSurvolClassName: 'hover:bg-teal-200/60',
  },
  {
    to: '/etudiants',
    label: 'Universitaires',
    icon: Users,
    accentActifClassName: 'bg-indigo-200 text-indigo-800 border-l-2 border-indigo-300',
    accentSurvolClassName: 'hover:bg-indigo-200/60',
  },
  {
    to: '/paiements',
    label: 'Paiements',
    icon: Wallet,
    accentActifClassName: 'bg-amber-200 text-amber-800 border-l-2 border-amber-300',
    accentSurvolClassName: 'hover:bg-amber-200/60',
  },
  {
    to: '/comptabilite',
    label: 'Comptabilité',
    icon: BookOpen,
    accentActifClassName: 'bg-emerald-200 text-emerald-800 border-l-2 border-emerald-300',
    accentSurvolClassName: 'hover:bg-emerald-200/60',
  },
  {
    to: '/consultations',
    label: 'Consultations',
    icon: Search,
    accentActifClassName: 'bg-cyan-200 text-cyan-800 border-l-2 border-cyan-300',
    accentSurvolClassName: 'hover:bg-cyan-200/60',
  },
  {
    to: '/editions',
    label: 'Éditions',
    icon: FileOutput,
    accentActifClassName: 'bg-violet-200 text-violet-800 border-l-2 border-violet-300',
    accentSurvolClassName: 'hover:bg-violet-200/60',
  },
  {
    to: '/aide',
    label: 'Aide',
    icon: HelpCircle,
    accentActifClassName: 'bg-sky-200 text-sky-800 border-l-2 border-sky-300',
    accentSurvolClassName: 'hover:bg-sky-200/60',
  },
];
