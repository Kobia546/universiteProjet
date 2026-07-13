import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  BookOpen,
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
  { to: '/etudiants', label: 'Étudiants', icon: Users },
  { to: '/inscriptions', label: 'Inscriptions', icon: GraduationCap },
  { to: '/paiements', label: 'Paiements', icon: Wallet },
  { to: '/comptabilite', label: 'Comptabilité', icon: BookOpen },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];
