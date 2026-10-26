let accessToken = null;
const listeners = new Set();
export const getAccessToken = () => accessToken;
export function setAccessToken(value) {
  accessToken = value;
}
export function invalidateAccessToken(usedToken) {
  if (!usedToken || usedToken !== accessToken) return;
  accessToken = null;
  listeners.forEach((listener) => listener(usedToken));
}
export function onAuthenticationLost(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
