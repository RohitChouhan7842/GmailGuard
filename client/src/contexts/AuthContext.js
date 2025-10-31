import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import TokenService from '../services/tokenService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Use TokenService to check for a valid session
      const hasToken = TokenService.getAccessToken();
      if (hasToken) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.user); // The interceptor handles token refresh
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData, refreshToken, expiresIn } = response;
      
      TokenService.setTokens(token, refreshToken, null, expiresIn);
      setUser(userData);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user: userData, refreshToken, expiresIn } = response;
      
      TokenService.setTokens(token, refreshToken, null, expiresIn);
      setUser(userData);
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const loginWithGoogle = () => {
    // Redirect to the AuthCallback component to handle the Google login flow
    window.location.href = '/auth/callback';
  };

  const logout = () => {
    TokenService.clearTokens();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
    setAuthData: (user, token, refreshToken, expiresIn) => {
      TokenService.setTokens(token, refreshToken, null, expiresIn);
      // The user will be fetched by the useEffect hook,
      // but we can set it here if it's passed.
      if (user) setUser(user);
    },
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
