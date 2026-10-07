"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Goal,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { CreateGoalButton } from "./create-goal-button";
import { GoalsList } from "./goals-list";
import type { SerializableGoalWithProgress } from "../types";
import { formatCurrency } from "@/utils/format-currency";

type GoalFilter = "ACTIVE" | "COMPLETED" | "ARCHIVED";
type GoalSort = "progress" | "deadline";

interface GoalsWorkspaceProps {
  active: SerializableGoalWithProgress[];
  completed: SerializableGoalWithProgress[];
  archived: SerializableGoalWithProgress[];
}

const FILTERS: { id: GoalFilter; label: string; icon: typeof Target }[] = [
  { id: "ACTIVE", label: "En curso", icon: Target },
  { id: "COMPLETED", label: "Completadas", icon: CheckCircle2 },
  { id: "ARCHIVED", label: "Archivadas", icon: Archive },
];

function formatGoalDate(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function GoalsWorkspace({ active, completed, archived }: GoalsWorkspaceProps) {
  const [filter, setFilter] = useState<GoalFilter>("ACTIVE");
  const [sort, setSort] = useState<GoalSort>("progress");
  const [query, setQuery] = useState("");

  const currentGoals = filter === "ACTIVE"
    ? active
    : filter === "COMPLETED"
      ? completed
      : archived;
  const normalizedQuery = query.trim().toLocaleLowerCase("es-HN");
  const visibleGoals = currentGoals
    .filter((goal) => `${goal.name} ${goal.description ?? ""}`.toLocaleLowerCase("es-HN").includes(normalizedQuery))
    .sort((first, second) => {
      if (sort === "deadline") {
        if (!first.targetDate) return 1;
        if (!second.targetDate) return -1;
        return first.targetDate.localeCompare(second.targetDate);
      }
      return Number(second.percentage) - Number(first.percentage);
    });

  const totalTarget = active.reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
  const totalSaved = active.reduce((sum, goal) => sum + Number(goal.currentAmount), 0);
  const totalRemaining = active.reduce((sum, goal) => sum + Number(goal.remaining), 0);
  const totalProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
  const featuredGoal = [...active].sort((first, second) => {
    if (first.targetDate && second.targetDate) return first.targetDate.localeCompare(second.targetDate);
    if (first.targetDate) return -1;
    if (second.targetDate) return 1;
    return Number(second.percentage) - Number(first.percentage);
  })[0];
  const counts: Record<GoalFilter, number> = {
    ACTIVE: active.length,
    COMPLETED: completed.length,
    ARCHIVED: archived.length,
  };

  return (
    <div className="space-y-7 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            <Target className="size-4" /> NEXO · PLANES COMPARTIDOS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Metas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cada objetivo se vuelve más alcanzable cuando avanzan en equipo.</p>
        </div>
        <CreateGoalButton size="default" label="Nueva meta" />
      </header>

      <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-primary-foreground/10" />
        <div className="pointer-events-none absolute -right-2 -top-16 size-44 rounded-full border border-primary-foreground/10" />
        <div className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm text-primary-foreground/75"><Sparkles className="size-4" /> Su progreso en conjunto</p>
            <p className="mt-3 text-4xl font-semibold tabular-nums sm:text-5xl">{formatCurrency(totalSaved)}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/75">
              De {formatCurrency(totalTarget)} planteados en {active.length} {active.length === 1 ? "meta activa" : "metas activas"}.
            </p>
            <div className="mt-5 max-w-lg">
              <div className="mb-2 flex items-center justify-between text-xs text-primary-foreground/75">
                <span>Avance combinado</span><span className="font-semibold tabular-nums text-primary-foreground">{totalProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-primary-foreground/15" role="progressbar" aria-label="Avance combinado de metas activas" aria-valuenow={Math.round(totalProgress)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-secondary transition-[width] duration-500" style={{ width: `${totalProgress}%` }} />
              </div>
            </div>
          </div>

          {featuredGoal ? (
            <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.08] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary-foreground/65">Próximo objetivo</p>
                  <Link href={`/metas/${featuredGoal.id}`} className="mt-1 block truncate text-lg font-semibold hover:underline">{featuredGoal.name}</Link>
                </div>
                <span className="shrink-0 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-xs font-semibold tabular-nums">{Number(featuredGoal.percentage).toFixed(0)}%</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-primary-foreground/15 pt-4">
                <div>
                  <p className="text-xs text-primary-foreground/65">Falta reunir</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">{formatCurrency(featuredGoal.remaining)}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/65">Objetivo</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                    <CalendarClock className="size-3.5 text-primary-foreground/70" />
                    {featuredGoal.targetDate ? formatGoalDate(featuredGoal.targetDate) : "Sin fecha límite"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <CreateContributionButton
                  size="default"
                  label="Aportar a esta meta"
                  defaultGoalId={featuredGoal.id}
                  goalOptions={active.map((goal) => ({ id: goal.id, name: goal.name }))}
                  className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:flex-1"
                />
                <Link href={`/metas/${featuredGoal.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary-foreground/20 px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                  Detalle <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.08] p-5">
              <p className="flex items-center gap-2 text-sm font-medium"><Goal className="size-4" /> Todo empieza con un objetivo compartido.</p>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/70">Definan qué quieren lograr y hagan visible cada pequeño avance.</p>
              <div className="mt-4"><CreateGoalButton variant="outline" size="default" label="Crear primera meta" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" /></div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de metas">
        <SummaryMetric icon={TrendingUp} label="Monto por completar" value={formatCurrency(totalRemaining)} detail="En todas las metas activas" tone="green" />
        <SummaryMetric icon={CheckCircle2} label="Metas completadas" value={String(completed.length)} detail="Objetivos alcanzados juntos" tone="blue" />
        <SummaryMetric icon={CircleDollarSign} label="Monto objetivo" value={formatCurrency(totalTarget)} detail="Suma de metas en curso" tone="amber" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-xl font-semibold">Sus objetivos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Explora, organiza y sigue cada plan.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar meta..."
                aria-label="Buscar metas por nombre o descripción"
                className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <div className="flex rounded-lg bg-muted p-1" aria-label="Ordenar metas activas">
              <button type="button" onClick={() => setSort("progress")} aria-pressed={sort === "progress"} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sort === "progress" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Progreso
              </button>
              <button type="button" onClick={() => setSort("deadline")} aria-pressed={sort === "deadline"} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sort === "deadline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Fecha límite
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Estado de las metas">
          {FILTERS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${filter === item.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="size-4" /> {item.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${filter === item.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{counts[item.id]}</span>
              </button>
            );
          })}
        </div>

        {visibleGoals.length ? (
          filter === "COMPLETED" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleGoals.map((goal) => <CompletedGoal key={goal.id} goal={goal} />)}
            </div>
          ) : (
            <GoalsList
              goals={visibleGoals}
              emptyMessage="No se encontraron metas"
              emptyDescription="Prueba con otro término de búsqueda."
            />
          )
        ) : (
          <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
            <Target className="mx-auto size-9 text-muted-foreground/50" />
            <p className="mt-3 font-medium">{normalizedQuery ? "No encontramos coincidencias" : filter === "ACTIVE" ? "Aún no hay metas activas" : filter === "COMPLETED" ? "Todavía no han completado una meta" : "No hay metas archivadas"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{normalizedQuery ? "Prueba otra búsqueda o limpia el filtro." : filter === "ACTIVE" ? "Creen un objetivo para empezar a construirlo juntos." : "Esta lista se actualizará conforme cambien sus metas."}</p>
            {!normalizedQuery && filter === "ACTIVE" && <div className="mt-4"><CreateGoalButton size="default" label="Crear una meta" /></div>}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "amber";
}) {
  const styles = {
    green: "bg-success/10 text-success",
    blue: "bg-primary/10 text-primary",
    amber: "bg-warning/15 text-warning-foreground",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className={`grid size-8 place-items-center rounded-lg ${styles[tone]}`}><Icon className="size-4" /></span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 truncate text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function CompletedGoal({ goal }: { goal: SerializableGoalWithProgress }) {
  return (
    <Link href={`/metas/${goal.id}`} className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-success/40 hover:bg-success/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold group-hover:text-success">{goal.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">Objetivo alcanzado</p>
        </div>
        <CheckCircle2 className="size-5 shrink-0 text-success" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
        <span className="font-semibold tabular-nums">{formatCurrency(goal.currentAmount)}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">Ver detalle <ArrowRight className="size-3.5" /></span>
      </div>
    </Link>
  );
}