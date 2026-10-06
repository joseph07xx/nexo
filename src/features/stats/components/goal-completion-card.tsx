import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import type { GoalCompletionSerializable } from "../types";

interface GoalCompletionCardProps {
  completion: GoalCompletionSerializable;
}

export function GoalCompletionCard({ completion }: GoalCompletionCardProps) {
  const hasTargets = completion.total > 0;
  const percentage = Number(completion.percentage);
  const displayPercentage = Math.min(100, percentage);

  return (
    <Card>
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Cumplimiento de objetivos
          </span>
        </div>

        {!hasTargets ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay objetivos mensuales registrados.
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold tabular-nums">
                {percentage.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {completion.completed} de {completion.total} meses
              </p>
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage >= 100
                    ? "bg-success"
                    : percentage >= 50
                      ? "bg-primary"
                      : "bg-warning"
                }`}
                style={{ width: `${displayPercentage}%` }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}