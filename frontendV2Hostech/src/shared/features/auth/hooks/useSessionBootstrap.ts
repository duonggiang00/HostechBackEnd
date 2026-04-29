/**
 * Session bootstrap: loads GET /api/profile once authenticated and merges
 * permissions / roles / properties into the auth store (see useProfile).
 */
export { useProfile as useSessionBootstrap, PROFILE_QUERY_KEY } from '@/shared/features/profile/hooks/useProfile';
