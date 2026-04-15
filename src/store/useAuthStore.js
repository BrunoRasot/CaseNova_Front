import { create } from 'zustand';

const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const useAuthStore = create((set) => ({
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,

    setSession: (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        set({ user: userData, token, isAuthenticated: true });
    },

    setLogin: (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        set({ user: userData, token, isAuthenticated: true });
    },

    setLogout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    }
}));

export default useAuthStore;