import { createContext } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";

export interface AuthResult {
  error: AuthError | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
