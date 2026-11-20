export const OWNER_EMAIL = 'lavytraveco@gmail.com';
interface Identity { email: string | null; emailVerified: boolean; providerData: { providerId: string }[] }
// UX filter only. Actual authorization is enforced by RTDB Security Rules.
export function isOwner(user: Identity | null): boolean {
  return !!user && user.email === OWNER_EMAIL && user.emailVerified && user.providerData.some(p => p.providerId === 'google.com');
}
