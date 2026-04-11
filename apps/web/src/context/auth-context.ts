import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export interface UserAuth {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  taxId?: string;
  phone?: string;
}

export interface AuthContextType {
  user: UserAuth | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<UserAuth>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
