import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [shop, setShop] = useState(() => {
    const stored = localStorage.getItem('shop');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token, user: u, shop: s } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('shop', JSON.stringify(s));
    localStorage.setItem('shopSlug', s.slug);
    setUser(u);
    setShop(s);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: u, shop: s } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('shop', JSON.stringify(s));
    localStorage.setItem('shopSlug', s.slug);
    setUser(u);
    setShop(s);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop');
    localStorage.removeItem('shopSlug');
    setUser(null);
    setShop(null);
  };

  return (
    <AuthContext.Provider value={{ user, shop, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
