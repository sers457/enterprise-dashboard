import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { LoginCredentials, RegisterData } from '@/types';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    clearError,
  } = useAuthStore();

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await storeLogin(credentials);
      if (!useAuthStore.getState().requiresMFA) {
        navigate('/dashboard');
      }
    } catch {
      // error is set in store
    }
  }, [storeLogin, navigate]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      await storeRegister(data);
      navigate('/dashboard');
    } catch {
      // error is set in store
    }
  }, [storeRegister, navigate]);

  const logout = useCallback(() => {
    storeLogout();
    navigate('/login');
  }, [storeLogout, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
}
