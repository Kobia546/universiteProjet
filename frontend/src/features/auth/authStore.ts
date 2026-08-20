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

const storedToken = localStorage.getItem('syfic_access_token');
const storedUser = localStorage.getItem('syfic_user');

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: storedToken,
  user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
  isAuthenticated: !!storedToken,
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
