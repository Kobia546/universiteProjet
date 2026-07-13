import { apiClient } from '../../shared/lib/apiClient';
import type { AuthUser } from './authStore';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, motDePasse: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, motDePasse });
  return data;
}
