import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  UserSafeProfile,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
} from '@ridemitra/shared';
import { apiClient } from '../lib/apiClient';

interface AuthContextType {
  user: UserSafeProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<UserSafeProfile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSafeProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.getMe();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (data: LoginRequest) => {
    const res = await apiClient.login(data);
    setUser(res.user);
  };

  const register = async (data: RegisterRequest) => {
    const res = await apiClient.register(data);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<UserSafeProfile> => {
    const res = await apiClient.updateProfile(data);
    setUser(res.user);
    return res.user;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
