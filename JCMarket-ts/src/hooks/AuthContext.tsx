import { createContext } from 'react';
import type {
  AuthUser,
  AuthSession,
  PasswordLoginInput,
  PasswordResetConfirmInput,
  PasswordResetRequestResponse,
  RegisterInput,
  UpdateProfileImageInput
} from '../types/auth';

export interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithPassword: (credentials: PasswordLoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResponse>;
  resetPassword: (input: PasswordResetConfirmInput) => Promise<void>;
  updateProfileImage: (input: UpdateProfileImageInput) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
