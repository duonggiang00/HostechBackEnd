import type { AuthResponse, AuthUser } from '../types';

/** Minimal session user after password or 2FA login (before GET /auth/me). */
export function authUserFromLoginPayload(user: NonNullable<AuthResponse['user']>): AuthUser {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role as AuthUser['role'],
    roles: user.roles ?? [],
    org_id: user.org_id ?? null,
    properties: [],
    permissions: user.permissions ?? [],
    avatar_url: user.avatar_url,
    profile_loaded: false,
  };
}

/** Mark session as fully hydrated after GET /auth/me (or profile). */
export function withProfileLoaded(user: AuthUser): AuthUser {
  return { ...user, profile_loaded: true };
}
