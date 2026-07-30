import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Wallet,
  BookOpen,
  Search,
  FileOutput,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/inscriptions', label: 'Inscriptions', icon: GraduationCap },
  { to: '/etudiants', label: 'Universitaires', icon: Users },
  { to: '/paiements', label: 'Paiements', icon: Wallet },
  { to: '/comptabilite', label: 'Comptabilité', icon: BookOpen },
  { to: '/consultations', label: 'Consultations', icon: Search },
  { to: '/editions', label: 'Éditions', icon: FileOutput },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];
