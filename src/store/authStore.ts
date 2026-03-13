import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
};

type AuthActions = {
  setUser: (user: User | null) => void;
};

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

