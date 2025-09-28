import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api'; // Import the pre-configured axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Set the token on the shared apiClient instance
      apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
      apiClient.get('/api/auth/user/')
        .then(response => {
          if (response.data && typeof response.data === 'object') {
            setUser(response.data);
          } else {
            localStorage.removeItem('authToken');
            delete apiClient.defaults.headers.common['Authorization'];
            setUser(null);
          }
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          delete apiClient.defaults.headers.common['Authorization'];
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/api/auth/login/', { username, password });
      const { token, user } = response.data;

      if (token && user) {
        localStorage.setItem('authToken', token);
        apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
        setUser(user);
      } else {
        throw new Error("Invalid login response from server.");
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Optional: await apiClient.post('/api/auth/logout/');
    } finally {
      localStorage.removeItem('authToken');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
