/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('taskflow_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || null);

  const setSession = useCallback((data) => {
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      setToken(data.accessToken);
    } else {
      localStorage.removeItem('accessToken');
      setToken(null);
    }

    const userObj = data?._id
      ? { _id: data._id, name: data.name, email: data.email, avatar: data.avatar }
      : null;

    if (userObj) {
      localStorage.setItem('taskflow_user', JSON.stringify(userObj));
    } else {
      localStorage.removeItem('taskflow_user');
    }
    setUser(userObj);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setSession(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setSession(data);
    return data;
  };

  const registerInvited = async (payload) => {
    const { data } = await api.post('/auth/register-invited', payload);
    setSession(data);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, registerInvited, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};
