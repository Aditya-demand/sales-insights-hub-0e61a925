import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  delta?: number; // percent
  icon: LucideIcon;
  accent?: "primary" | "accent" | "chart-3" | "chart-4";
};

export function KpiCard({ label, value, delta, icon: Icon, accent = "primary" }: Props) {
  const accentBg: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    "chart-3": "bg-chart-3/15 text-chart-3",
    "chart-4": "bg-chart-4/15 text-chart-4",
  };
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-md)] transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {delta !== undefined && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}% vs prev
            </div>
          )}
        </div>
        <div className={cn("h-11 w-11 rounded-xl grid place-items-center", accentBg[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}