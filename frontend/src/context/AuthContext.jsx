import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

const checkAuth = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    setLoading(false);
    return;
  }

  try {
    const response = await authAPI.getCurrentUser();
    if (response.data.success) {
      const userData = response.data.data;
      
      // CRITICAL FIX: Extract tenantId from tenant object
      if (userData.tenant && userData.tenant.id && !userData.tenantId) {
        userData.tenantId = userData.tenant.id;
      }
      
      setUser(userData);
      setIsAuthenticated(true);
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } finally {
    setLoading(false);
  }
};

  const login = async (email, password, tenantSubdomain) => {
    try {
      const response = await authAPI.login({ 
        email, 
        password, 
        tenantSubdomain: tenantSubdomain || undefined 
      });
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // For super admin users, ensure tenantId is handled (can be null)
        if (user.role === 'super_admin' && !user.tenantId) {
          user.tenantId = null; // Explicitly set to null for super admin
        }
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        console.log('User logged in:', user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.registerTenant(data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
