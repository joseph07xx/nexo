"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
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
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  Crown,
  Goal,
  HeartHandshake,
  Layers3,
  ListChecks,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { StatsData } from "../types";
import { formatCurrency } from "@/utils/format-currency";

type Period = 6 | 12 | 0;
type ChartMode = "monthly" | "cumulative";

interface StatsDashboardProps {
  data: StatsData;
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const periodOptions: { value: Period; label: string }[] = [
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
  { value: 0, label: "Todo" },
];

function monthLabel(year: number, month: number) {
  return `${MONTHS[month - 1]} ${year.toString().slice(-2)}`;
}

export function StatsDashboard({ data }: StatsDashboardProps) {
  const [period, setPeriod] = useState<Period>(6);
  const [chartMode, setChartMode] = useState<ChartMode>("monthly");

  const points = period === 0
    ? data.monthlyChart
    : data.monthlyChart.slice(-period);
  const cumulativeByKey = new Map(
    data.cumulative.map((point) => [point.key, Number(point.cumulative)])
  );
  const chartData = points.map((point) => ({
    key: point.key,
    label: monthLabel(point.year, point.month),
    ahorro: Number(point.total),
    objetivo: point.target ? Number(point.target) : null,
    acumulado: cumulativeByKey.get(point.key) ?? 0,
  }));
  const periodTotal = points.reduce((total, point) => total + Number(point.total), 0);
  const periodAverage = points.length ? periodTotal / points.length : 0;
  const bestPeriod = points.reduce<(typeof points)[number] | null>(
    (best, point) => !best || Number(point.total) > Number(best.total) ? point : best,
    null
  );
  const periodLabel = period === 0 ? "todo el historial" : `los últimos ${period} meses`;

  function exportCsv() {
    const rows = [
      ["Mes", "Ahorro (HNL)", "Objetivo (HNL)", "Acumulado (HNL)"],
      ...chartData.map((point) => [
        point.label,
        point.ahorro.toFixed(2),
        point.objetivo?.toFixed(2) ?? "",
        point.acumulado.toFixed(2),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nexo-estadisticas-${period === 0 ? "historial" : `${period}-meses`}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const insight = data.goalCompletion.total === 0
    ? "Definan una meta mensual para medir cuánto avanza su ahorro en equipo."
    : data.goalCompletion.percentage === "100.00"
      ? "Cumplieron todas sus metas mensuales registradas. Ese hábito ya está dando frutos."
      : `Llevan ${data.goalCompletion.percentage}% de cumplimiento en sus metas mensuales.`;

  return (
    <div className="space-y-7 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <BarChart3 className="size-4" /> NEXO · SU PROGRESO
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Estadísticas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Una mirada clara a lo que construyen juntos.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Descargar estadísticas del periodo como CSV"
        >
          <ArrowDownToLine className="size-4" /> Exportar CSV
        </button>
      </header>

      <section className="relative overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-primary-foreground/10" />
        <div className="pointer-events-none absolute -right-4 -top-12 size-48 rounded-full border border-primary-foreground/10" />
        <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm text-primary-foreground/75">
              <Wallet className="size-4" /> Ahorro acumulado
            </p>
            <p className="mt-3 text-4xl font-semibold tabular-nums sm:text-5xl">
              {formatCurrency(data.summary.totalAllTime)}
            </p>
            <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/75">
              Cada aporte suma. Ya registraron {data.summary.contributionsCount} aportes
              {" "}en {data.summary.activeMonths} meses activos.
            </p>
          </div>

          <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.07] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/70">
                  En {periodLabel}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatCurrency(periodTotal)}
                </p>
              </div>
              <div className="flex rounded-lg bg-black/15 p-1" aria-label="Periodo de estadísticas">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    aria-pressed={period === option.value}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      period === option.value
                        ? "bg-primary-foreground text-primary"
                        : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-primary-foreground/15 pt-4">
              <div>
                <p className="text-xs text-primary-foreground/65">Promedio del periodo</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{formatCurrency(periodAverage)}</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/65">Mejor mes</p>
                <p className="mt-1 text-sm font-semibold">
                  {bestPeriod ? `${monthLabel(bestPeriod.year, bestPeriod.month)} · ${formatCurrency(bestPeriod.total)}` : "Sin datos"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores generales">
        <Metric icon={TrendingUp} label="Promedio mensual" value={formatCurrency(data.summary.monthlyAverage)} note="En meses con aportes" tone="green" />
        <Metric icon={CalendarDays} label="Meses activos" value={String(data.summary.activeMonths)} note="Con al menos un aporte" tone="blue" />
        <Metric icon={ListChecks} label="Aportes registrados" value={String(data.summary.contributionsCount)} note="Construyendo el hábito" tone="orange" />
        <Metric icon={Goal} label="Metas cumplidas" value={`${data.goalCompletion.completed}/${data.goalCompletion.total}`} note={data.goalCompletion.total ? `${data.goalCompletion.percentage}% de cumplimiento` : "Aún no hay metas mensuales"} tone="violet" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">Evolución del ahorro</p>
              <h2 className="mt-1 text-lg font-semibold">
                {chartMode === "monthly" ? "Aporte por mes" : "Ahorro acumulado"}
              </h2>
            </div>
            <div className="flex w-fit rounded-lg bg-muted p-1" aria-label="Tipo de gráfica">
              <button type="button" onClick={() => setChartMode("monthly")} aria-pressed={chartMode === "monthly"} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${chartMode === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Mensual
              </button>
              <button type="button" onClick={() => setChartMode("cumulative")} aria-pressed={chartMode === "cumulative"} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${chartMode === "cumulative" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Acumulado
              </button>
            </div>
          </div>

          {chartData.length ? (
            <div className="h-64 w-full sm:h-72" role="img" aria-label={`Gráfica de ${chartMode === "monthly" ? "ahorro mensual" : "ahorro acumulado"} para ${periodLabel}`}>
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "monthly" ? (
                  <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={14} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value ?? 0)), name === "ahorro" ? "Ahorro" : "Objetivo"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)" }} />
                    <Bar dataKey="ahorro" fill="var(--color-secondary)" radius={[5, 5, 0, 0]} maxBarSize={42} />
                    <Line dataKey="objetivo" stroke="var(--color-warning)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} type="monotone" />
                  </ComposedChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
                    <defs>
                      <linearGradient id="statsGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={0.26} />
                        <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={14} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value ?? 0)), "Acumulado"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)" }} />
                    <Area dataKey="acumulado" type="monotone" stroke="var(--color-secondary)" strokeWidth={2.5} fill="url(#statsGrowth)" activeDot={{ r: 5 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No hay datos para este periodo.</div>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><i className="size-2.5 rounded-full bg-secondary" />{chartMode === "monthly" ? "Ahorro" : "Acumulado"}</span>
            {chartMode === "monthly" && <span className="inline-flex items-center gap-2"><i className="h-0 w-4 border-t-2 border-dashed border-warning" />Objetivo mensual</span>}
            <span className="ml-auto">Montos en lempiras</span>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary"><Sparkles className="size-4" /> Lectura del progreso</p>
            <p className="mt-3 text-sm leading-6 text-foreground">{insight}</p>
            <Link href="/metas" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Ver metas <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Constancia</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{data.habitSummary?.consistencyScore ?? 0}<span className="ml-0.5 text-sm font-medium text-muted-foreground">%</span></p>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-success/10 text-success"><HeartHandshake className="size-5" /></div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Consistencia de ahorro" aria-valuenow={data.habitSummary?.consistencyScore ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${data.habitSummary?.consistencyScore ?? 0}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{data.habitSummary?.recommendation ?? "Registren aportes para descubrir sus hábitos de ahorro."}</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><HeartHandshake className="size-5" /></div>
            <div>
              <h2 className="font-semibold">Ahorro en equipo</h2>
              <p className="text-xs text-muted-foreground">Distribución de aportes históricos</p>
            </div>
          </div>
          <div className="mt-5 space-y-5">
            {data.userDistribution.map((member, index) => {
              const colors = ["var(--color-primary)", "var(--color-secondary)"];
              const color = colors[index % colors.length];
              return (
                <div key={member.userId}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium"><i className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} /> <span className="truncate">{member.name ?? "Integrante"}</span></span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{member.percentage}% · {formatCurrency(member.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, Number(member.percentage))}%`, backgroundColor: color }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-warning/15 text-warning-foreground"><Crown className="size-5" /></div>
            <div>
              <h2 className="font-semibold">Momentos destacados</h2>
              <p className="text-xs text-muted-foreground">Sus meses de mayor y menor ahorro</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Highlight label="Mejor mes" point={data.bestMonth} positive />
            <Highlight label="Mes más bajo" point={data.worstMonth} />
          </div>
          <div className="mt-5 flex items-start gap-3 border-t border-border pt-4 text-sm">
            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Layers3 className="size-4" /></div>
            <p className="leading-5 text-muted-foreground">
              En promedio ahorran <span className="font-semibold text-foreground">{formatCurrency(data.summary.monthlyAverage)}</span> por mes activo.
            </p>
          </div>
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted/50 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-card text-muted-foreground"><Check className="size-4" /></div>
          <p className="text-sm text-muted-foreground">Los datos reflejan los aportes y metas registrados en NEXO.</p>
        </div>
        <Link href="/actividad" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Ver actividad <ArrowUpRight className="size-4" />
        </Link>
      </footer>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  note: string;
  tone: "green" | "blue" | "orange" | "violet";
}) {
  const tones = {
    green: "bg-success/10 text-success",
    blue: "bg-primary/10 text-primary",
    orange: "bg-warning/15 text-warning-foreground",
    violet: "bg-secondary/20 text-secondary-foreground",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tones[tone]}`}><Icon className="size-4" /></span>
      </div>
      <p className="mt-3 truncate text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function Highlight({
  label,
  point,
  positive = false,
}: {
  label: string;
  point: StatsData["bestMonth"];
  positive?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold">{point ? monthLabel(point.year, point.month) : "Sin datos"}</p>
      <p className={`mt-1 truncate text-sm font-medium tabular-nums ${positive ? "text-success" : "text-foreground"}`}>
        {point ? formatCurrency(point.total) : "Registra aportes"}
      </p>
    </div>
  );
}