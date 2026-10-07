"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";
import type { CumulativePointSerializable } from "../types";

interface CumulativeChartProps {
  data: CumulativePointSerializable[];
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

export function CumulativeChart({ data }: CumulativeChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    label: `${MONTH_LABELS[d.month - 1]} ${d.year.toString().slice(-2)}`,
    acumulado: Number(d.cumulative),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Progreso acumulado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                  return v.toString();
                }}
              />
              <Tooltip
  formatter={(value) => [
    formatCurrency(typeof value === "number" ? value : 0),
    "Acumulado",
  ]}
  labelStyle={{ fontSize: 12, fontWeight: 500 }}
  contentStyle={{
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid var(--color-border)",
  }}
/>
              <Line
                dataKey="acumulado"
                stroke="var(--color-secondary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--color-secondary)" }}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}