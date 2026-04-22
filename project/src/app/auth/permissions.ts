import type { Role } from "./roles";

export type Permission =
  | "platform:tenant:create"
  | "platform:tenant:update"
  | "platform:tenant:view_all"
  | "platform:tenant_user:assign_role"
  | "platform:product:view_all"
  | "tenant:listing:create"
  | "tenant:listing:update"
  | "tenant:listing:view"
  | "tenant:listing:submit"
  | "tenant:listing:approve"
  | "tenant:listing:reject"
  | "tenant:listing:final_confirm";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  platform_super_admin: [
    "platform:tenant:create",
    "platform:tenant:update",
    "platform:tenant:view_all",
    "platform:tenant_user:assign_role",
    "platform:product:view_all",
  ],
  tenant_admin: [
    "tenant:listing:create",
    "tenant:listing:update",
    "tenant:listing:view",
    "tenant:listing:submit",
  ],
  tenant_maker: ["tenant:listing:create", "tenant:listing:update", "tenant:listing:view", "tenant:listing:submit"],
  tenant_checker: [
    "tenant:listing:view",
    "tenant:listing:approve",
    "tenant:listing:reject",
    "tenant:listing:final_confirm",
  ],
  tenant_viewer: ["tenant:listing:view"],
};
