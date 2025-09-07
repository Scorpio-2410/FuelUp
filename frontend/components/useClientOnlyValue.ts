/**
 * Client-only value hook that returns different values for server and client environments.
 * Currently returns client value as native platforms don't support server-side rendering.
 * Used to handle platform-specific behavior and prevent hydration mismatches on web.
 */
// This function is web-only as native doesn't currently support server (or build-time) rendering.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return client;
}
