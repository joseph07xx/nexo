
"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";
import type { MonthlyChartPointSerializable } from "../types";

interface MonthlyProgressChartProps {
  data: MonthlyChartPointSerializable[];
}

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function MonthlyProgressChart({
  data,
}: MonthlyProgressChartProps) {
  const chartData = data.map((d) => ({
    label: `${MONTH_LABELS[d.month - 1]} ${d.year.toString().slice(-2)}`,
    ahorro: Number(d.total),
    objetivo: d.target ? Number(d.target) : null,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ahorro mensual</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{
                top: 8,
                right: 8,
                bottom: 0,
                left: -12,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-muted-foreground)",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--color-muted-foreground)",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000) {
                    return `${(v / 1000).toFixed(0)}k`;
                  }

                  return v.toString();
                }}
              />

              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(
                    typeof value === "number" ? value : 0
                  ),
                  name === "ahorro" ? "Ahorro" : "Objetivo",
                ]}
                labelStyle={{
                  fontSize: 12,
                  fontWeight: 500,
                }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border:
                    "1px solid var(--color-border)",
                }}
              />

              <Bar
                dataKey="ahorro"
                fill="var(--color-primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />

              <Line
                dataKey="objetivo"
                stroke="var(--color-secondary)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{
                  r: 3,
                  fill: "var(--color-secondary)",
                }}
                connectNulls={false}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-primary" />
            <span>Ahorro</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border-2 border-dashed border-secondary" />
            <span>Objetivo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
