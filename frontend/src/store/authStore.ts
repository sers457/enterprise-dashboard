import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types';
import api from '@/lib/axios';

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresMFA: boolean;
  mfaToken?: string;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      requiresMFA: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          const data = response.data;
          
          if (data.mfa_required) {
            set({ requiresMFA: true, mfaToken: data.user_id, isLoading: false });
            return;
          }

          const token = data.access_token;
          const refreshToken = data.refresh_token;
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const userRes = await api.get('/auth/me');
          
          set({
            user: userRes.data,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            requiresMFA: false,
          });
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', data);
          const user = response.data;
          const loginRes = await api.post('/auth/login', { email: data.email, password: data.password });
          const tokens = loginRes.data;
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
          set({
            user,
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          requiresMFA: false,
          mfaToken: undefined,
          error: null,
        });
      },

      setToken: (token: string) => set({ token }),
      setRefreshToken: (refreshToken: string) => set({ refreshToken }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
