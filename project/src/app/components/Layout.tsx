import { Outlet, Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ChevronDown, Coins } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";

import { UserRole, useApp } from "../context/AppContext";

type NavChild = {
  label: string;
  to: string;
};

type NavItem =
  | {
      type: "link";
      label: string;
      to: string;
      allowedRoles: UserRole[];
    }
  | {
      type: "dropdown";
      label: string;
      allowedRoles: UserRole[];
      children: NavChild[];
      disabledHint?: string;
    };

const navItems: NavItem[] = [
  {
    type: "dropdown",
    label: "Create",
    allowedRoles: ["issuer"],
    disabledHint: "需发行方权限",
    children: [
      { label: "Create Fund Issuance", to: "/create/fund-issuance" },
      { label: "Create Fund Redemption", to: "/create/fund-redemption" },
      { label: "Create Fund Distribution", to: "/create/fund-distribution" },
    ],
  },
  {
    type: "dropdown",
    label: "Manage",
    allowedRoles: ["issuer"],
    disabledHint: "需发行方权限",
    children: [
      { label: "Manage Fund Issuance", to: "/manage/fund-issuance" },
      { label: "Manage Fund Redemption", to: "/manage/fund-redemption" },
      { label: "Manage Fund Distribution", to: "/manage/fund-distribution" },
    ],
  },
  {
    type: "dropdown",
    label: "Marketplace",
    allowedRoles: ["investor"],
    children: [{ label: "Fund Issuance", to: "/marketplace/fund-issuance" }],
  },
  {
    type: "link",
    label: "User",
    to: "/user",
    allowedRoles: ["issuer", "investor"],
  },
];

function getRoleLabel(role: UserRole) {
  return role === "issuer" ? "发行方" : "投资者";
}


export function Layout() {
  const location = useLocation();
  const { userRole } = useApp();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const allowed = item.allowedRoles.includes(userRole);

    if (item.type === "link") {
      if (!allowed) return null;
      return (
        <Link
          key={item.label}
          to={item.to}
          className={`flex items-center gap-1 px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium ${
            isActive(item.to) ? "bg-secondary" : ""
          }`}
        >
          {item.label}
        </Link>
      );
    }

    if (allowed) {
      return (
        <DropdownMenu key={item.label}>
          <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium">
            {item.label}
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {item.children.map((child) => (
              <DropdownMenuItem key={child.to} asChild>
                <Link to={child.to}>{child.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (!item.disabledHint) return null;

    return (
      <Tooltip key={`${item.label}-disabled`}>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60"
          >
            {item.label}
            <ChevronDown className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{item.disabledHint}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-white/90">
        <div className="container mx-auto flex h-16 items-center px-6">
          <Link to="/" className="flex items-center gap-2 mr-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--navy-700)] to-[var(--navy-900)] flex items-center justify-center">
              <Coins className="w-6 h-6 text-[var(--gold-500)]" />
            </div>
            <span className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              RWA Tokenization
            </span>
          </Link>

          <nav className="flex gap-1 flex-1">{navItems.map((item) => renderNavItem(item))}</nav>

          {/* Role Switcher */}
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-medium">
              当前身份：{getRoleLabel(userRole)}
            </Badge>
            <RoleSwitcher />
            <Link
              to="/connect-wallet"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2026 RWA Tokenization Platform. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
