import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, Calendar, ListChecks } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import type { StatsSummary } from "../types";

interface StatsSummaryProps {
  summary: StatsSummary;
}

export function StatsSummary({ summary }: StatsSummaryProps) {
  const items = [
    {
      label: "Ahorro total",
      value: formatCurrency(summary.totalAllTime),
      icon: Wallet,
    },
    {
      label: "Promedio mensual",
      value: formatCurrency(summary.monthlyAverage),
      icon: TrendingUp,
    },
    {
      label: "Meses activos",
      value: summary.activeMonths.toString(),
      icon: Calendar,
    },
    {
      label: "Aportes totales",
      value: summary.contributionsCount.toString(),
      icon: ListChecks,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="pt-5 pb-4 px-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Icon className="size-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
                <p className="text-lg font-semibold tabular-nums truncate">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}