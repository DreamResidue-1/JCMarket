import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api, { setAccessToken } from '../lib/api';
import { queueCompanyNotice } from '../lib/companyNotice';
import { getErrorMessage } from '../lib/errors';
import type {
  AuthResponse,
  AuthSession,
  AuthUser,
  MeResponse,
  PasswordLoginInput,
  PasswordResetConfirmInput,
  PasswordResetRequestResponse,
  RegisterInput,
  UpdateProfileImageInput
} from '../types/auth';
import { AuthContext, type AuthContextType } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

const sessionHintKey = 'jcmarket-has-session';

const setSessionHint = (value: boolean) => {
  try {
    if (value) {
      localStorage.setItem(sessionHintKey, 'true');
    } else {
      localStorage.removeItem(sessionHintKey);
    }
  } catch {
    // Ignore storage errors.
  }
};

const getSessionHint = () => {
  try {
    return localStorage.getItem(sessionHintKey) === 'true';
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistSession = (authResponse: AuthResponse, userData: AuthUser) => {
    const nextSession: AuthSession = {
      accessToken: authResponse.accessToken,
      user: userData
    };

    setAccessToken(nextSession.accessToken);
    setSession(nextSession);
    setUser(userData);
    setSessionHint(true);
  };

  const authenticateWithResponse = async (authResponse: AuthResponse) => {
    setAccessToken(authResponse.accessToken);
    const meResponse = await api.get<MeResponse>('/api/auth/me');
    persistSession(authResponse, meResponse.data);
  };

  const authenticateWithGoogle = async (credential: string) => {
    const response = await api.post<AuthResponse>('/api/auth/google', { credential });
    await authenticateWithResponse(response.data);
  };

  const authenticateWithPassword = async ({ email, password }: PasswordLoginInput) => {
    const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
    await authenticateWithResponse(response.data);
  };

  const registerWithPassword = async (input: RegisterInput) => {
    const response = await api.post<AuthResponse>('/api/auth/register', input);
    await authenticateWithResponse(response.data);
  };

  const refreshSession = async () => {
    const response = await api.post<AuthResponse>('/api/auth/refresh');
    await authenticateWithResponse(response.data);
  };

  const requestPasswordReset = async (email: string) => {
    setError(null);

    try {
      const response = await api.post<PasswordResetRequestResponse>('/api/auth/forgot-password/request', { email });
      return response.data;
    } catch (resetError) {
      setError(getErrorMessage(resetError, 'Password reset request failed.'));
      throw resetError;
    }
  };

  const confirmPasswordReset = async (input: PasswordResetConfirmInput) => {
    await api.post('/api/auth/forgot-password/confirm', input);
  };

  const updateProfileImageRequest = async ({ picture }: UpdateProfileImageInput) => {
    const response = await api.patch<MeResponse>('/api/auth/me', { picture });

    if (!session?.accessToken) {
      throw new Error('No active session.');
    }

    persistSession({ accessToken: session.accessToken }, response.data);
  };

  const logoutUser = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore logout errors on the client.
    }

    setAccessToken(null);
    setSession(null);
    setUser(null);
    setSessionHint(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (!getSessionHint()) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshSession();
      } catch {
        setAccessToken(null);
        setSession(null);
        setUser(null);
        setSessionHint(false);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAuthAction = async (
    action: () => Promise<void>,
    fallbackMessage: string,
    successMessage?: string
  ) => {
    setError(null);

    try {
      await action();
      if (successMessage) {
        queueCompanyNotice(successMessage);
      }
    } catch (authError) {
      setError(getErrorMessage(authError, fallbackMessage));
      throw authError;
    }
  };

  const loginWithGoogle = async (credential: string) => runAuthAction(
    () => authenticateWithGoogle(credential),
    'Google sign-in failed.',
    'Message from JCMarket: You logged in successfully with Google.'
  );

  const loginWithPassword = async (credentials: PasswordLoginInput) => runAuthAction(
    () => authenticateWithPassword(credentials),
    'Login failed.',
    'Message from JCMarket: You logged in successfully.'
  );

  const register = async (input: RegisterInput) => runAuthAction(
    () => registerWithPassword(input),
    'Registration failed.',
    'Message from JCMarket: Your account is ready and you are now signed in.'
  );

  const resetPassword = async (input: PasswordResetConfirmInput) => {
    setError(null);

    try {
      await confirmPasswordReset(input);
      setAccessToken(null);
      setSession(null);
      setUser(null);
      setSessionHint(false);
    } catch (resetError) {
      setError(getErrorMessage(resetError, 'Password reset failed.'));
      throw resetError;
    }
  };

  const updateProfileImage = async (input: UpdateProfileImageInput) => {
    setError(null);

    try {
      await updateProfileImageRequest(input);
    } catch (profileError) {
      setError(getErrorMessage(profileError, 'Profile image update failed.'));
      throw profileError;
    }
  };

  const logout = () => {
    void logoutUser();
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loginWithGoogle,
    loginWithPassword,
    register,
    requestPasswordReset,
    resetPassword,
    updateProfileImage,
    logout,
    isAuthenticated: !!user,
    isLoading,
    error,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
