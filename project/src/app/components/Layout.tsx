import { Outlet, Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown, Coins } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import { useApp } from "../context/AppContext";

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
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
            <span className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              RWA Tokenization
            </span>
          </Link>

          <nav className="flex gap-1 flex-1">
            {/* Create Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium">
                Create
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/create/fund-issuance">Create Fund Issuance</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/create/fund-redemption">Create Fund Redemption</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/create/fund-distribution">Create Fund Distribution</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Manage Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium">
                Manage
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/manage/fund-issuance">Manage Fund Issuance</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/manage/fund-redemption">Manage Fund Redemption</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/manage/fund-distribution">Manage Fund Distribution</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Marketplace Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium">
                Marketplace
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/marketplace/fund-issuance">Fund Issuance</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Link */}
            <Link
              to="/user"
              className={`flex items-center gap-1 px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium ${
                isActive('/user') ? 'bg-secondary' : ''
              }`}
            >
              User
            </Link>
          </nav>

          {/* Role Switcher */}
          <div className="ml-auto flex items-center gap-3">
            <RoleSwitcher />
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Connect Wallet
            </button>
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
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
