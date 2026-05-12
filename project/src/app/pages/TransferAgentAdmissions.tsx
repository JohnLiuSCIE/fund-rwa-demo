import { useMemo, useState, type ReactNode } from "react";
import {
  Ban,
  CheckCircle2,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { MetricCard } from "../components/MetricCard";
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
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import type { RegisterAccount, WalletLink } from "../data/fundDemoData";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type AdmissionTab = "queue" | "whitelist" | "exceptions";

function statusVariant(status: string): BadgeVariant {
  if (["Rejected", "Removed", "Suspended", "Expired", "Missing"].includes(status)) return "destructive";
  if (["Pending", "Submitted"].includes(status)) return "secondary";
  if (["Whitelisted", "Verified", "Active"].includes(status)) return "default";
  return "outline";
}

function formatDate(value?: string) {
  if (!value) return "Pending";
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function shortWallet(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getAdmissionState(account: RegisterAccount, link: WalletLink) {
  if (link.whitelistStatus === "Pending" || link.proofStatus === "Submitted" || account.accountStatus === "Pending") {
    return "Awaiting TA Review";
  }
  if (link.whitelistStatus === "Whitelisted") return "Whitelisted";
  if (link.proofStatus === "Rejected") return "Rejected";
  if (link.whitelistStatus === "Removed") return "Removed";
  if (link.whitelistStatus === "Suspended") return "Suspended";
  if (link.proofStatus === "Expired") return "Proof Expired";
  return link.whitelistStatus;
}

export function TransferAgentAdmissions() {
  const {
    approveWalletLink,
    fundIssuances,
    registerAccounts,
    rejectWalletLink,
    removeWalletFromWhitelist,
    walletLinks,
  } = useApp();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AdmissionTab>("queue");

  const fundNameById = useMemo(
    () => new Map(fundIssuances.map((fund) => [fund.id, fund.name])),
    [fundIssuances],
  );
  const accountById = useMemo(
    () => new Map(registerAccounts.map((account) => [account.registerAccountId, account])),
    [registerAccounts],
  );

  const rows = useMemo(
    () =>
      walletLinks
        .map((wallet) => {
          const account = accountById.get(wallet.registerAccountId);
          if (!account) return null;
          return {
            wallet,
            account,
            fundName: fundNameById.get(account.fundId) || account.fundId,
            admissionState: getAdmissionState(account, wallet),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [accountById, fundNameById, walletLinks],
  );

  const reviewRows = rows.filter(
    ({ account, wallet }) =>
      wallet.whitelistStatus === "Pending" || wallet.proofStatus === "Submitted" || account.accountStatus === "Pending",
  );
  const whitelistedRows = rows.filter(({ wallet }) => wallet.whitelistStatus === "Whitelisted");
  const exceptionRows = rows.filter(
    ({ wallet }) =>
      wallet.whitelistStatus !== "Pending" &&
      (["Removed", "Suspended"].includes(wallet.whitelistStatus) ||
        ["Rejected", "Expired", "Missing"].includes(wallet.proofStatus)),
  );

  const rowsByTab = {
    queue: reviewRows,
    whitelist: whitelistedRows,
    exceptions: exceptionRows,
  };

  const visibleRows = rowsByTab[activeTab].filter(({ account, wallet, fundName, admissionState }) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return [
      account.holderName,
      account.holderId,
      account.registerAccountId,
      account.classId,
      account.accountStatus,
      fundName,
      wallet.walletAddress,
      wallet.chainId,
      wallet.proofStatus,
      wallet.whitelistStatus,
      admissionState,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const runWalletCommand = (
    action: "approve" | "reject" | "remove",
    wallet: WalletLink,
  ) => {
    const result =
      action === "approve"
        ? approveWalletLink(wallet.walletLinkId, wallet.version)
        : action === "reject"
          ? rejectWalletLink(wallet.walletLinkId, wallet.version)
          : removeWalletFromWhitelist(wallet.walletLinkId, wallet.version);

    if (result.success) {
      toast.success(result.message);
      return;
    }
    toast.error(result.message || "Whitelist command failed.");
  };

  const renderActions = (wallet: WalletLink) => {
    if (wallet.whitelistStatus === "Whitelisted") {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline">
              Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove wallet from whitelist?</AlertDialogTitle>
              <AlertDialogDescription>
                TA will remove this wallet from the active whitelist. The holder record stays in the register,
                but the account is marked suspended until a new admission review is completed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => runWalletCommand("remove", wallet)}>Remove Wallet</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    if (wallet.whitelistStatus === "Pending" || wallet.proofStatus === "Submitted") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => runWalletCommand("approve", wallet)}>
            Approve
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject admission request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This rejects the wallet proof and removes the applicant from whitelist eligibility for this
                  demo register.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => runWalletCommand("reject", wallet)}>Reject Request</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    return (
      <Button size="sm" variant="outline" onClick={() => runWalletCommand("approve", wallet)}>
        Restore
      </Button>
    );
  };

  const renderMobileRows = () => (
    <div className="space-y-3 md:hidden">
      {visibleRows.map(({ account, wallet, fundName, admissionState }) => (
        <div key={wallet.walletLinkId} className="rounded-lg border p-4 text-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{account.holderName}</div>
              <div className="font-mono text-xs text-muted-foreground">{account.registerAccountId}</div>
            </div>
            <Badge variant={statusVariant(admissionState)}>{admissionState}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground">Fund</div>
              <div className="font-medium">{fundName}</div>
              <div className="text-xs text-muted-foreground">{account.classId}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Wallet</div>
              <div className="font-mono text-xs">{shortWallet(wallet.walletAddress)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Proof</div>
              <Badge variant={statusVariant(wallet.proofStatus)}>{wallet.proofStatus}</Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Whitelist</div>
              <Badge variant={statusVariant(wallet.whitelistStatus)}>{wallet.whitelistStatus}</Badge>
            </div>
          </div>
          <div className="mt-4">{renderActions(wallet)}</div>
        </div>
      ))}
      {visibleRows.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No wallet admission record matches this view.
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Transfer Agent</Badge>
            <Badge variant="secondary">Admission Control</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)" }}>Investor Admission & Whitelist</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Review new holder wallet proofs, approve or reject whitelist access, and remove existing wallets
            from the active transfer whitelist.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Search className="h-4 w-4 text-muted-foreground" />
            Admission Search
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Holder, wallet, fund, class, status"
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard icon={UserPlus} label="Pending Review" value={reviewRows.length} variant="warning" />
        <MetricCard icon={ShieldCheck} label="Whitelisted" value={whitelistedRows.length} variant="success" />
        <MetricCard icon={XCircle} label="Exceptions" value={exceptionRows.length} variant="warning" />
        <MetricCard icon={Users} label="Register Accounts" value={registerAccounts.length} variant="primary" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-4 w-4" />
              Wallet Admission Register
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Decisions are written to the shared mock backend and reflected in the Book of Record.
            </p>
          </div>
          <Badge variant="outline">{visibleRows.length} shown</Badge>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdmissionTab)} className="gap-4">
            <TabsList className="max-w-full overflow-x-auto">
              <TabsTrigger value="queue">Review Queue ({reviewRows.length})</TabsTrigger>
              <TabsTrigger value="whitelist">Whitelist ({whitelistedRows.length})</TabsTrigger>
              <TabsTrigger value="exceptions">Removed / Exceptions ({exceptionRows.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="queue">
              {renderMobileRows()}
              <AdmissionTable rows={visibleRows} renderActions={renderActions} />
            </TabsContent>
            <TabsContent value="whitelist">
              {renderMobileRows()}
              <AdmissionTable rows={visibleRows} renderActions={renderActions} />
            </TabsContent>
            <TabsContent value="exceptions">
              {renderMobileRows()}
              <AdmissionTable rows={visibleRows} renderActions={renderActions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function AdmissionTable({
  rows,
  renderActions,
}: {
  rows: Array<{
    wallet: WalletLink;
    account: RegisterAccount;
    fundName: string;
    admissionState: string;
  }>;
  renderActions: (wallet: WalletLink) => ReactNode;
}) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead>Holder</TableHead>
            <TableHead>Fund / Class</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Proof</TableHead>
            <TableHead>Whitelist</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ account, wallet, fundName, admissionState }) => (
            <TableRow key={wallet.walletLinkId}>
              <TableCell>
                <div className="font-medium">{account.holderName}</div>
                <div className="font-mono text-xs text-muted-foreground">{account.registerAccountId}</div>
                <div className="text-xs text-muted-foreground">{account.holderType}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{fundName}</div>
                <div className="text-xs text-muted-foreground">{account.classId}</div>
              </TableCell>
              <TableCell>
                <div className="max-w-[220px] truncate font-mono text-xs">{wallet.walletAddress}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <WalletCards className="h-3.5 w-3.5" />
                  {wallet.chainId}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(wallet.proofStatus)}>{wallet.proofStatus}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(wallet.whitelistStatus)}>{wallet.whitelistStatus}</Badge>
              </TableCell>
              <TableCell>{formatDate(wallet.verifiedAt)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(admissionState)}>{admissionState}</Badge>
              </TableCell>
              <TableCell>{renderActions(wallet)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                  <Ban className="h-5 w-5" />
                  No wallet admission record matches this view.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
