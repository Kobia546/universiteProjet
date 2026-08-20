import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import type { ModuleCode } from '../../shared/components/layout/navItems';

export function ModuleRoute({
  module,
  children,
}: {
  module: ModuleCode;
  children: React.ReactNode;
}) {
  const modules = useAuthStore((s) => s.user?.modules);

  if (!modules?.includes(module)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
