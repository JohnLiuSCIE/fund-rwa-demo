import { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { ChevronDown, Coins, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { RoleSwitcher } from "./RoleSwitcher";
import { WalletConnectButton } from "./WalletConnectButton";
import { useApp } from "../context/AppContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetDemoData, userRole } = useApp();
  const showResetDataControl = import.meta.env.VITE_SHOW_RESET_DEMO_DATA === "true";
  const isTransferAgent = userRole === "transferAgent";

  useEffect(() => {
    if (typeof document === "undefined") return;

    const roleClass =
      userRole === "transferAgent" ? "role-transfer-agent" : userRole === "issuer" ? "role-issuer" : "role-investor";
    const roleClasses = ["role-issuer", "role-transfer-agent", "role-investor"];

    [document.documentElement, document.body].forEach((element) => {
      element.dataset.appRole = userRole;
      element.classList.remove("dark", ...roleClasses);
      element.classList.add(roleClass);
    });
  }, [userRole]);

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
    isTransferAgent
      ? `flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-800)] sm:px-3 sm:text-sm md:px-4 ${
          active ? "bg-white/15 text-white shadow-[inset_0_-2px_0_var(--gold-500)] hover:bg-white/20" : ""
        }`
      : `flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors hover:bg-secondary sm:px-3 sm:text-sm md:px-4 ${
          active ? "bg-secondary" : ""
        }`;
  const navLinkClass = (active: boolean) =>
    isTransferAgent
      ? `flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-800)] sm:px-3 sm:text-sm md:px-4 ${
          active ? "bg-white/15 text-white shadow-[inset_0_-2px_0_var(--gold-500)] hover:bg-white/20" : ""
        }`
      : `flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors hover:bg-secondary sm:px-3 sm:text-sm md:px-4 ${
          active ? "bg-secondary" : ""
        }`;

  const transferAgentNavItems = [
    { label: "Console", to: "/ta" },
    { label: "Workflows", to: "/ta/queue" },
    { label: "Exceptions", to: "/ta/reconciliation" },
  ];
  const isBookOfRecordActive = ["/ta/register", "/ta/admissions"].some((path) => isActive(path));

  const handleResetDemoData = () => {
    resetDemoData();
    toast.success("Workspace data reset to the original seed state.");
  };

  const headerClass = isTransferAgent
    ? "sticky top-0 z-50 w-full border-b border-white/10 bg-[var(--navy-800)] text-white shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-[rgba(15,23,41,0.94)]"
    : "sticky top-0 z-50 w-full border-b bg-background/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/90";
  const brandMarkClass = isTransferAgent
    ? "flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 shadow-sm"
    : "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--navy-700)] to-[var(--navy-900)]";
  const resetButtonClass = isTransferAgent
    ? "shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white focus-visible:ring-[var(--gold-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-800)]"
    : "shrink-0";
  const walletButtonClass = isTransferAgent
    ? "max-w-[12rem] border border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white focus-visible:ring-[var(--gold-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-800)]"
    : "max-w-[12rem]";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={headerClass}>
        <div className="container mx-auto flex min-h-16 flex-wrap items-center gap-2 px-4 py-2 md:h-16 md:flex-nowrap md:px-6 md:py-0">
          {showResetDataControl ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  aria-label="Reset workspace data"
                  className={resetButtonClass}
                  data-testid="reset-demo-data-trigger"
                  size="icon"
                  title="Reset workspace data"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset workspace data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This restores the shared backend, TA workflows, holder register, orders, distributions,
                    redemptions, and on-chain evidence back to the original seed. Your current role stays signed in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    data-testid="reset-demo-data-confirm"
                    onClick={handleResetDemoData}
                  >
                    Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <Link to="/" className="mr-0 flex shrink-0 items-center gap-2 md:mr-8">
            <div className={brandMarkClass}>
              <Coins className="w-6 h-6 text-[var(--gold-500)]" />
            </div>
            <span className="text-base font-semibold sm:text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
              RWA Tokenization
            </span>
          </Link>

          <nav className="order-3 flex w-full min-w-0 flex-none gap-1 overflow-x-auto pb-1 md:order-none md:w-auto md:flex-1 md:pb-0">
            {userRole === "transferAgent" ? (
              <>
                {transferAgentNavItems.map((item) => (
                  <Link key={item.to} to={item.to} className={navLinkClass(item.to === "/ta" ? location.pathname === item.to : location.pathname.startsWith(item.to))}>
                    {item.label}
                  </Link>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger className={navTriggerClass(isBookOfRecordActive)}>
                    Book of Record
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => navigate("/ta/register")} onSelect={() => navigate("/ta/register")}>
                      Fund Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/ta/admissions")} onSelect={() => navigate("/ta/admissions")}>
                      User Management
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

            {userRole === "investor" ? (
              <Link
                to="/user"
                className={navLinkClass(isActive("/user"))}
              >
                User
              </Link>
            ) : null}
          </nav>

          {/* Role Switcher */}
          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
            <RoleSwitcher
              className={
                isTransferAgent
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-[var(--gold-500)] focus-visible:ring-offset-[var(--navy-800)]"
                  : undefined
              }
              iconClassName={isTransferAgent ? "text-white/80" : undefined}
            />
            <WalletConnectButton className={walletButtonClass} />
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
