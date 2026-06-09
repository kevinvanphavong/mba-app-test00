import { create } from "zustand";

interface User {
  id: string;
  email: string;
  roles: string[];
}

interface Centre {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  centre: Centre | null;
  setUser: (user: User | null) => void;
  setCentre: (centre: Centre | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  centre: null,
  setUser: (user) => set({ user }),
  setCentre: (centre) => set({ centre }),
  reset: () => set({ user: null, centre: null }),
}));
