// src/utils/jwt.ts
// Utility to check if a JWT token is expired

export function isTokenExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
}
