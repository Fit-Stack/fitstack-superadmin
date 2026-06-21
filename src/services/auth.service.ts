import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';
import { AuthResponse, SuperAdminUser } from '@/types';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      API_ENDPOINTS.SUPER_ADMIN_LOGIN,
      { email, password },
    );

    if (data.user?.role !== 'super_admin') {
      throw new Error('This account is not a super admin.');
    }

    if (data.access_token) {
      localStorage.setItem('sa_access_token', data.access_token);
      localStorage.setItem('sa_user', JSON.stringify(data.user));
    }

    return data;
  }

  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('sa_access_token');
      localStorage.removeItem('sa_user');
    }
  }

  getCurrentUser(): SuperAdminUser | null {
    const raw = localStorage.getItem('sa_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('sa_access_token');
  }
}

export const authService = new AuthService();
