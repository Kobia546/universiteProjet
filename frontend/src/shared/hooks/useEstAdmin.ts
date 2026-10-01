import { useAuthStore } from '../../features/auth/authStore';

/** Vrai si l'utilisateur connecté a accès au module Administration. */
export function useEstAdmin(): boolean {
  const modules = useAuthStore((s) => s.user?.modules);
  return !!modules?.includes('ADMINISTRATION');
}
