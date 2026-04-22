import type { Permission } from "./permissions";
import { ROLE_PERMISSIONS } from "./permissions";
import { getScopeByRole, type Role, type UserIdentity } from "./roles";

export interface AccessContext {
  tenantId?: string;
}

export function can(user: UserIdentity, permission: Permission, context: AccessContext = {}): boolean {
  return user.roles.some((role) => roleHasPermission(role, permission, user, context));
}

export function roleHasPermission(
  role: Role,
  permission: Permission,
  user: UserIdentity,
  context: AccessContext,
): boolean {
  if (!ROLE_PERMISSIONS[role].includes(permission)) return false;

  const scope = getScopeByRole(role);
  if (scope === "platform") return true;

  if (!context.tenantId) return Boolean(user.tenantId);
  return context.tenantId === user.tenantId;
}
