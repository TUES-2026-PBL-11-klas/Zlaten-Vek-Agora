export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  role?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
}
