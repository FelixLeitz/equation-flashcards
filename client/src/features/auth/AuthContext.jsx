import { createContext, useContext } from 'react';
import { useCurrentUser } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: user, isLoading } = useCurrentUser();

  const value = {
    user: user ?? null,
    isAuthenticated: Boolean(user),
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
