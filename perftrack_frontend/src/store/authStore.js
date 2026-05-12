import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  login: (userData, access, refresh) => {
    localStorage.setItem('pt_access', access);
    localStorage.setItem('pt_refresh', refresh);
    set({ user: userData, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const refresh = localStorage.getItem('pt_refresh');
      const access = localStorage.getItem('pt_access');
      if (refresh && access) {
        await fetch(
          `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/auth/logout/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access}`,
            },
            body: JSON.stringify({ refresh }),
          }
        );
      }
    } catch (e) {
      // Ignore logout API errors
    }
    localStorage.removeItem('pt_access');
    localStorage.removeItem('pt_refresh');
    set({ user: null, isAuthenticated: false });
  },

  initFromStorage: () => {
    const token = localStorage.getItem('pt_access');
    if (token) {
      try {
        // Decode JWT payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          // We need the user data — fetch from /auth/me/
          return true; // Signal that we have a valid token
        }
      } catch {
        localStorage.removeItem('pt_access');
        localStorage.removeItem('pt_refresh');
      }
    }
    return false;
  },

  setUser: (userData) => {
    set({ user: userData, isAuthenticated: true });
  },
}));
