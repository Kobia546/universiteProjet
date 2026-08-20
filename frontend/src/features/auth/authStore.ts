import { create } from 'zustand';

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  profil: { id: string; nom: string };
  modules: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
}

function isValidAuthUser(value: unknown): value is AuthUser {
  const u = value as AuthUser | null;
  return !!u && !!u.profil && typeof u.profil.nom === 'string' && Array.isArray(u.modules);
}

// Une session mise en cache avant l'introduction des profils (ancien format
// `{ role: string }`) n'a plus le bon format — on l'efface pour forcer une
// reconnexion propre plutôt que de planter au rendu.
let storedToken = localStorage.getItem('syfic_access_token');
const storedUserRaw = localStorage.getItem('syfic_user');
let storedUser: AuthUser | null = null;
try {
  const parsed = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  if (isValidAuthUser(parsed)) {
    storedUser = parsed;
  }
} catch {
  storedUser = null;
}
if (!storedUser) {
  localStorage.removeItem('syfic_access_token');
  localStorage.removeItem('syfic_user');
  storedToken = null;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: storedToken,
  user: storedUser,
  isAuthenticated: !!storedToken && !!storedUser,
  login: (accessToken, user) => {
    localStorage.setItem('syfic_access_token', accessToken);
    localStorage.setItem('syfic_user', JSON.stringify(user));
    set({ accessToken, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('syfic_access_token');
    localStorage.removeItem('syfic_user');
    set({ accessToken: null, user: null, isAuthenticated: false });
  },
}));
