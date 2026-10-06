import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";
import type { UserDistributionItem } from "../types";

interface UserDistributionChartProps {
  distribution: UserDistributionItem[];
}

export function UserDistributionChart({
  distribution,
}: UserDistributionChartProps) {
  if (distribution.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Distribución de aportes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {distribution.map((item) => {
          const percent = Number(item.percentage);
          return (
            <div key={item.userId} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium truncate">{item.name}</span>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {formatCurrency(item.total)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                {percent.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}