export type UserRole = "USER" | "ADMIN";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  phoneNumber?: string | null;
}

type MaybeSession = { user?: unknown } | null | undefined;

/** Resolve a session user (typed) or null. */
export function getSessionUser(session: MaybeSession): SessionUser | null {
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** True when the session user has the admin role. */
export function isAdmin(session: MaybeSession): boolean {
  return getSessionUser(session)?.role === "ADMIN";
}

/** True when the session user has the student role. */
export function isStudent(session: MaybeSession): boolean {
  return getSessionUser(session)?.role === "USER";
}

/** Best-effort display name for a session user. */
export function getDisplayName(user: SessionUser | null | undefined): string {
  if (!user) return "User";
  return (
    user.name ||
    user.email?.split("@")[0] ||
    user.phoneNumber ||
    "User"
  );
}

