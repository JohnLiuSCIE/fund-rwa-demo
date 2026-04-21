import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; label: string; pulse?: boolean }
    > = {
      Draft: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: "Draft",
      },
      "Pending Approval": {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        label: "Pending Approval",
        pulse: true,
      },
      "Pending Listing": {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Pending Listing",
        pulse: true,
      },
      Upcoming: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Upcoming",
      },
      "Upcoming Launch": {
        color: "bg-sky-100 text-sky-800 border-sky-200",
        label: "Upcoming Launch",
      },
      "Open For Subscription": {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Open For Subscription",
        pulse: true,
      },
      "Initial Subscription": {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        label: "Initial Subscription",
        pulse: true,
      },
      "Allocation Period": {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        label: "Allocation Period",
      },
      Calculated: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        label: "Calculated",
      },
      "Allocate On Chain": {
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        label: "Allocate On Chain",
      },
      "Allocation Completed": {
        color: "bg-violet-100 text-violet-800 border-violet-200",
        label: "Allocation Completed",
      },
      "Issuance Completed": {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Issuance Completed",
      },
      "Issuance Active": {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        label: "Issuance Active",
      },
      "Active Dealing": {
        color: "bg-teal-100 text-teal-800 border-teal-200",
        label: "Active Dealing",
        pulse: true,
      },
      Paused: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        label: "Paused",
      },
      Active: {
        color: "bg-teal-100 text-teal-800 border-teal-200",
        label: "Active",
      },
      Announced: {
        color: "bg-sky-100 text-sky-800 border-sky-200",
        label: "Announced",
      },
      "Window Open": {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Window Open",
        pulse: true,
      },
      "Window Closed": {
        color: "bg-slate-100 text-slate-800 border-slate-200",
        label: "Window Closed",
      },
      Submitted: {
        color: "bg-slate-100 text-slate-800 border-slate-200",
        label: "Submitted",
      },
      "Pending Review": {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        label: "Pending Review",
      },
      "Pending NAV": {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Pending NAV",
      },
      "Pending Confirmation": {
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        label: "Pending Confirmation",
      },
      "Pending Cash Settlement": {
        color: "bg-violet-100 text-violet-800 border-violet-200",
        label: "Pending Cash Settlement",
      },
      "Pending Instruction": {
        color: "bg-slate-100 text-slate-800 border-slate-200",
        label: "Pending Instruction",
      },
      "Awaiting Payment": {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        label: "Awaiting Payment",
        pulse: true,
      },
      "Payment Proof Uploaded": {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Payment Proof Uploaded",
      },
      "Funds Received": {
        color: "bg-sky-100 text-sky-800 border-sky-200",
        label: "Funds Received",
      },
      "Funds Cleared": {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        label: "Funds Cleared",
      },
      Failed: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Failed",
      },
      "Not Applicable": {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        label: "N/A",
      },
      Confirmed: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        label: "Confirmed",
      },
      Completed: {
        color: "bg-teal-100 text-teal-800 border-teal-200",
        label: "Completed",
      },
      "Pending Allocation": {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        label: "Pending Allocation",
      },
      "Put On Chain": {
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        label: "Put On Chain",
      },
      "Open For Distribution": {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Open For Distribution",
      },
      Done: {
        color: "bg-teal-100 text-teal-800 border-teal-200",
        label: "Done",
      },
      Scheduled: {
        color: "bg-slate-100 text-slate-800 border-slate-200",
        label: "Scheduled",
      },
      Processing: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Processing",
      },
      Settled: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        label: "Settled",
      },
      Rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Rejected",
      },
    };

    return (
      configs[status] || {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: status,
      }
    );
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      className={`${config.color} border ${
        config.pulse ? "animate-pulse" : ""
      }`}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {config.label}
    </Badge>
  );
}
