import api from './api';

export const login = async (username, password) => {
  try {
    const response = await api.post('/users/login/', { username, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user_id,
        username: response.data.username
      }));
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await api.post('/users/register/', { username, email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const ensureAuthenticated = async () => {
  if (!isAuthenticated()) return false;
  
  try {
    const response = await api.get('/users/profile/');
    return true;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logout();
    }
    return false;
  }
};

export const checkTokenValidity = async () => {
  if (!isAuthenticated()) return false;
  
  try {
    const response = await api.get('/users/profile/');
    return true;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logout();
    }
    return false;
  }
};