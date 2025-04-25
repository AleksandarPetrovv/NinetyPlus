import { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, isAuthenticated as checkIsAuthenticated, logout as authLogout, checkTokenValidity } from '../services/authService';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const validateToken = async () => {
      if (checkIsAuthenticated()) {
        const isValid = await checkTokenValidity();
        if (isValid) {
          setUser(getCurrentUser());
        } else {
          authLogout();
        }
      }
      setLoading(false);
    };
    
    validateToken();
  }, []);
  
  const logout = () => {
    authLogout();
    setUser(null);
  };

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    logout,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};