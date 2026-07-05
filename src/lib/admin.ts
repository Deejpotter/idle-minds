export function isAdmin(userId: string | null): boolean {
  if (!userId) return false;
  return userId === process.env.ADMIN_CLERK_USER_ID;
}
