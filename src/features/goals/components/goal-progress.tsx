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
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <span
          className={
            variant === "full"
              ? "text-3xl font-bold tabular-nums"
              : "text-2xl font-semibold tabular-nums"
          }
        >
          {formatCurrency(currentAmount)}
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">
          / {formatCurrency(targetAmount)}
        </span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isComplete ? "bg-success" : "bg-primary"
          }`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground tabular-nums">
          {displayPercentage.toFixed(0)}%
        </span>
        {isComplete ? (
          <span className="text-success font-medium">Meta alcanzada</span>
        ) : (
          <span className="text-muted-foreground tabular-nums">
            Faltan {formatCurrency(remaining)}
          </span>
        )}
      </div>
    </div>
  );
}