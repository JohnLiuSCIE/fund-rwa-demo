import { LoaderCircle } from "lucide-react";

import { cn } from "../ui/utils";

export type LoadingStageTone = "primary" | "slate" | "teal" | "cyan";

interface LoadingStagePanelProps {
  title: string;
  description: string;
  items?: string[];
  tone?: LoadingStageTone;
}

function getToneClasses(tone: LoadingStageTone) {
  switch (tone) {
    case "teal":
      return {
        iconWrap: "bg-teal-50 text-teal-700",
        icon: "text-teal-600",
        pulse: "bg-teal-300",
        dot: "bg-teal-500",
        bar: "bg-teal-500/80",
      };
    case "cyan":
      return {
        iconWrap: "bg-cyan-50 text-cyan-700",
        icon: "text-cyan-600",
        pulse: "bg-cyan-300",
        dot: "bg-cyan-500",
        bar: "bg-cyan-500/80",
      };
    case "slate":
      return {
        iconWrap: "bg-slate-100 text-slate-700",
        icon: "text-slate-600",
        pulse: "bg-slate-300",
        dot: "bg-slate-500",
        bar: "bg-slate-500/80",
      };
    case "primary":
    default:
      return {
        iconWrap: "bg-primary/10 text-primary",
        icon: "text-primary",
        pulse: "bg-primary/30",
        dot: "bg-primary",
        bar: "bg-primary/80",
      };
  }
}

export function LoadingStagePanel({
  title,
  description,
  items = [
    "Request queued and being processed",
    "Waiting for secure confirmation",
    "Syncing workflow status",
  ],
  tone = "primary",
}: LoadingStagePanelProps) {
  const toneClasses = getToneClasses(tone);

  return (
    <div className="space-y-6 py-8">
      <div className="space-y-4 text-center">
        <div
          className={cn(
            "relative mx-auto flex h-16 w-16 items-center justify-center rounded-full",
            toneClasses.iconWrap,
          )}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full opacity-30 animate-ping",
              toneClasses.pulse,
            )}
          />
          <LoaderCircle className={cn("relative h-8 w-8 animate-spin", toneClasses.icon)} />
        </div>
        <div className="space-y-2">
          <h3>{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.slice(0, 3).map((item, index) => (
          <div key={`${item}-${index}`} className="rounded-xl border bg-white/95 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", toneClasses.dot)} />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Processing
              </span>
            </div>
            <div className="mt-3 text-sm font-medium text-foreground">{item}</div>
            <div className="mt-4 space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full animate-pulse", toneClasses.bar)}
                  style={{ width: index === 0 ? "72%" : index === 1 ? "58%" : "81%" }}
                />
              </div>
              <div
                className="h-2 rounded-full bg-slate-100 animate-pulse"
                style={{ width: index === 0 ? "84%" : index === 1 ? "67%" : "74%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
