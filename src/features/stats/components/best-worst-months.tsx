import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import type { BestWorstMonthSerializable } from "../types";

interface BestWorstMonthsProps {
  best: BestWorstMonthSerializable | null;
  worst: BestWorstMonthSerializable | null;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function BestWorstMonths({ best, worst }: BestWorstMonthsProps) {
  if (!best && !worst) return null;

  const isSameMonth =
    best && worst && best.key === worst.key;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {best && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-success mb-2">
              <TrendingUp className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Mejor mes
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatMonth(best.year, best.month)}
            </p>
            <p className="text-xl font-semibold tabular-nums mt-1">
              {formatCurrency(best.total)}
            </p>
          </CardContent>
        </Card>
      )}

      {worst && !isSameMonth && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingDown className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Peor mes
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatMonth(worst.year, worst.month)}
            </p>
            <p className="text-xl font-semibold tabular-nums mt-1">
              {formatCurrency(worst.total)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}