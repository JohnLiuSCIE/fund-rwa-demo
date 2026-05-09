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
  const { userRole } = useApp();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isFundsActive = [
    "/funds",
    "/create/fund-issuance",
    "/fund-issuance",
    "/marketplace/fund-issuance",
  ].some((path) => isActive(path));

  const isOperationsActive = [
    "/manage/fund-issuance",
    "/manage/fund-redemption",
    "/manage/fund-distribution",
    "/create/fund-redemption",
    "/create/fund-distribution",
    "/fund-redemption",
    "/fund-distribution",
  ].some((path) => isActive(path));

  const isActivitiesActive = [
    "/marketplace/fund-redemption",
    "/marketplace/fund-distribution",
  ].some((path) => isActive(path));

  const navTriggerClass = (active: boolean) =>
    `flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary md:px-4 ${
      active ? "bg-secondary" : ""
    }`;
  const navLinkClass = (active: boolean) =>
    `flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary md:px-4 ${
      active ? "bg-secondary" : ""
    }`;

  const transferAgentNavItems = [
    { label: "Console", to: "/ta" },
    { label: "Workflows", to: "/ta/queue" },
    { label: "Book of Record", to: "/ta/register" },
    { label: "Exceptions", to: "/ta/reconciliation" },
    { label: "Evidence", to: "/ta/evidence" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-white/90">
        <div className="container mx-auto flex min-h-16 flex-wrap items-center gap-2 px-4 py-2 md:h-16 md:flex-nowrap md:px-6 md:py-0">
          <Link to="/" className="mr-0 flex shrink-0 items-center gap-2 md:mr-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--navy-700)] to-[var(--navy-900)] flex items-center justify-center">
              <Coins className="w-6 h-6 text-[var(--gold-500)]" />
            </div>
            <span className="text-base font-semibold sm:text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
              RWA Tokenization
            </span>
          </Link>

          <nav className="order-3 flex w-full flex-none gap-1 overflow-x-auto pb-1 md:order-none md:w-auto md:flex-1 md:pb-0">
            {userRole === "transferAgent" ? (
              <>
                {transferAgentNavItems.map((item) => (
                  <Link key={item.to} to={item.to} className={navLinkClass(item.to === "/ta" ? location.pathname === item.to : location.pathname.startsWith(item.to))}>
                    {item.label}
                  </Link>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger className={navTriggerClass(isActive("/ta/transfers"))}>
                    More
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/ta/transfers">Secondary Bridge</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger className={navTriggerClass(isFundsActive)}>
                    Funds
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/funds">Funds Workspace</Link>
                    </DropdownMenuItem>
                    {userRole === "issuer" ? (
                      <DropdownMenuItem asChild>
                        <Link to="/create/fund-issuance">Create New Fund</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link to="/marketplace/fund-issuance">Explore Fund Opportunities</Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={navTriggerClass(userRole === "issuer" ? isOperationsActive : isActivitiesActive)}
                  >
                    {userRole === "issuer" ? "Operations" : "Activities"}
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {userRole === "issuer" ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/manage/fund-issuance">Launch Queue</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/manage/fund-redemption">Global Redemption Queue</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/manage/fund-distribution">Global Distribution Queue</Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/marketplace/fund-redemption">Redemption Opportunities</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/marketplace/fund-distribution">Distribution Events</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Link
              to="/user"
              className={navLinkClass(isActive("/user"))}
            >
              User
            </Link>
          </nav>

          {/* Role Switcher */}
          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
            <RoleSwitcher />
            <Link
              to="/connect-wallet"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 md:px-4"
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
