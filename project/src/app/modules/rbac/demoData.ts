import type { TenantProfile, UserIdentity } from "../../auth/roles";

export const DEMO_TENANTS: TenantProfile[] = [
  { tenantId: "tenant-alpha", tenantName: "Alpha Asset Management", status: "active" },
  { tenantId: "tenant-beta", tenantName: "Beta Treasury SPC", status: "active" },
];

export const DEMO_USERS: UserIdentity[] = [
  {
    userId: "platform-001",
    displayName: "Platform Super Admin",
    roles: ["platform_super_admin"],
  },
  {
    userId: "maker-alpha-001",
    displayName: "Alpha Maker",
    tenantId: "tenant-alpha",
    roles: ["tenant_maker"],
  },
  {
    userId: "checker-alpha-001",
    displayName: "Alpha Checker",
    tenantId: "tenant-alpha",
    roles: ["tenant_checker"],
  },
];
