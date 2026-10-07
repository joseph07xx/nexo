import { formatCurrency } from "@/utils/format-currency";

interface GoalProgressProps {
  currentAmount: string;
  targetAmount: string;
  remaining: string;
  percentage: string;
  isComplete: boolean;
  variant?: "compact" | "full";
}

export function GoalProgress({
  currentAmount,
  targetAmount,
  remaining,
  percentage,
  isComplete,
  variant = "compact",
}: GoalProgressProps) {
  const numericPercentage = Number(percentage);
  const displayPercentage = Math.min(100, numericPercentage);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <span
          className={
            variant === "full"
              ? "text-3xl font-bold tabular-nums tracking-tight"
              : "text-2xl font-semibold tabular-nums tracking-tight"
          }
        >
          {formatCurrency(currentAmount)}
        </span>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground tabular-nums">
          / {formatCurrency(targetAmount)}
        </span>
      </div>

      <div className="overflow-hidden rounded-full bg-muted/80">
        <div
          className={`h-2.5 rounded-full transition-all ${
            isComplete ? "bg-success" : "bg-gradient-to-r from-primary to-primary/80"
          }`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 font-medium text-primary tabular-nums">
          {displayPercentage.toFixed(0)}%
        </span>
        {isComplete ? (
          <span className="rounded-full bg-success/10 px-2 py-1 font-medium text-success">
            Meta alcanzada
          </span>
        ) : (
          <span className="text-muted-foreground tabular-nums">
            Faltan {formatCurrency(remaining)}
          </span>
        )}
      </div>
    </div>
  );
}