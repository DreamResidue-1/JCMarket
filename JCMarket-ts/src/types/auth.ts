export type UserRole = 'admin' | 'user' | 'moderator';
export type AuthPermission = 'create_product' | 'manage_users' | (string & {});

export interface GoogleIdentityPayload {
  aud: string;
  azp?: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name?: string;
  given_name?: string;
  iat: number;
  iss: string;
  jti?: string;
  name?: string;
  nbf?: number;
  picture?: string;
  sub: string;
}

export interface AuthUser {
  id: string;
  sub: string;
  email: string;
  picture: string | null;
  verifiedEmail: boolean;
  role: UserRole;
  permissions: AuthPermission[];
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface AuthResponse {
  accessToken: string;
}

export interface MeResponse {
  id: string;
  sub: string;
  email: string;
  picture: string | null;
  verifiedEmail: boolean;
  role: UserRole;
  permissions: AuthPermission[];
}

export interface AuthSessionStatusResponse {
  authenticated: boolean;
  accessToken?: string;
  user?: AuthUser;
}

export type GoogleAuthResponse = AuthResponse;

export interface AdminUser extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  roles: UserRole[];
  users: AdminUser[];
}

export interface PasswordLoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  picture?: string;
}

export interface PasswordResetRequestResponse {
  message: string;
  developmentCode?: string;
  deliveryMethod?: 'development' | 'email';
}

export interface PasswordResetConfirmInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface UpdateProfileImageInput {
  picture: string | null;
}
