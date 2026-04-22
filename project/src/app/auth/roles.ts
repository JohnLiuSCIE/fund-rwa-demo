export type Scope = "platform" | "tenant";

export type PlatformRole = "platform_super_admin";

export type TenantRole = "tenant_admin" | "tenant_maker" | "tenant_checker" | "tenant_viewer";

export type Role = PlatformRole | TenantRole;

export interface UserIdentity {
  userId: string;
  displayName: string;
  tenantId?: string;
  roles: Role[];
}

export interface TenantProfile {
  tenantId: string;
  tenantName: string;
  status: "active" | "suspended";
}

export const PLATFORM_ROLES: PlatformRole[] = ["platform_super_admin"];

export const TENANT_ROLES: TenantRole[] = [
  "tenant_admin",
  "tenant_maker",
  "tenant_checker",
  "tenant_viewer",
];

export function getScopeByRole(role: Role): Scope {
  return role.startsWith("platform_") ? "platform" : "tenant";
}
