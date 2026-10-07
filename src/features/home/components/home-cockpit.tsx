"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  Gauge,
  HandCoins,
  SlidersHorizontal,
  Target,
  TrendingUp,
} from "lucide-react";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { MonthlyTargetModal } from "@/features/monthly-targets/components/monthly-target-modal";
import { Button } from "@/components/ui/button";
import type { GoalOption } from "@/features/contributions/components/contribution-form";
import type { SerializableMonthlyProgress } from "@/features/monthly-targets/types";
import { formatCurrency, formatDateShort, getIsoDateInAppTimezone } from "@/utils/format-currency";

interface HomeGoal {
  id: string;
  name: string;
  currentAmount: string;
  targetAmount: string;
  remaining: string;
  percentage: string;
  isComplete: boolean;
  targetDate: string | null;
}

interface HomeContribution {
  id: string;
  amount: string;
  contributionDate: string;
  note: string | null;
  user: { id: string; name: string };
  goal: { id: string; name: string } | null;
}

interface HomeCockpitProps {
  greeting: string;
  firstName: string;
  totalAllTime: string;
  monthlySaved: string;
  monthlyProgress: SerializableMonthlyProgress;
  activeGoal: HomeGoal | null;
  activeGoalsCount: number;
  completedGoalsCount: number;
  goalOptions: GoalOption[];
  memberTotals: Array<{ userId: string; name: string; total: string }>;
  recentContributions: HomeContribution[];
}

export function HomeCockpit({
  greeting,
  firstName,
  totalAllTime,
  monthlySaved,
  monthlyProgress,
  activeGoal,
  activeGoalsCount,
  completedGoalsCount,
  goalOptions,
  memberTotals,
  recentContributions,
}: HomeCockpitProps) {
  const router = useRouter();
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const monthlyTarget = Number(monthlyProgress.targetAmount);
  const monthlyPercentage = Math.min(100, Number(monthlyProgress.percentage));
  const weeklyDefault = monthlyTarget > 0
    ? Math.max(50, Math.min(5000, Math.round(monthlyTarget / 4.33 / 50) * 50))
    : 250;
  const [weeklyPlan, setWeeklyPlan] = useState(weeklyDefault);

  const monthlyEquivalent = (weeklyPlan * 52) / 12;
  const projectedWeeks = activeGoal && weeklyPlan > 0
    ? Math.ceil(Number(activeGoal.remaining) / weeklyPlan)
    : null;
  const projectedDate = projectedWeeks && projectedWeeks <= 2600
    ? getProjectedDate(projectedWeeks)
    : null;
  const targetDateValue = activeGoal?.targetDate?.slice(0, 10) ?? null;
  const isTargetDatePast = targetDateValue
    ? targetDateValue < getIsoDateInAppTimezone()
    : false;
  const weeksUntilTarget = targetDateValue && !isTargetDatePast
    ? getWeeksUntilTarget(targetDateValue)
    : null;
  const canReachTargetDate = projectedWeeks !== null && weeksUntilTarget !== null
    ? projectedWeeks <= weeksUntilTarget
    : null;

  const totalMembers = memberTotals.reduce((sum, member) => sum + Number(member.total), 0);
  const monthlyGoalId = activeGoal?.id;

  function handleTargetSuccess() {
    setTargetModalOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm lg:hidden">
            <Gauge className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">NEXO · TABLERO DEL HOGAR</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{greeting}, {firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Así avanza su plan de ahorro compartido.</p>
          </div>
        </div>
        <CreateContributionButton
          label="Registrar aporte"
          size="default"
          defaultGoalId={monthlyGoalId}
          goalOptions={goalOptions}
          className="w-full sm:w-auto"
        />
      </header>

      <section className="relative overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 border-l border-primary-foreground/10 lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm text-primary-foreground/75"><CircleDollarSign className="size-4" /> Ahorro de este mes</p>
            <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">{formatCurrency(monthlySaved)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-primary-foreground/75">
              <span className="inline-flex items-center gap-1.5"><TrendingUp className="size-4" /> {formatCurrency(totalAllTime)} acumulados</span>
              <span className="hidden size-1 rounded-full bg-primary-foreground/40 sm:block" />
              <span>{activeGoalsCount} {activeGoalsCount === 1 ? "meta activa" : "metas activas"}</span>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.06] p-4 sm:p-5">
            <div
              className="grid size-28 shrink-0 place-items-center rounded-full p-2 sm:size-32"
              style={{ background: `conic-gradient(var(--color-secondary) ${monthlyProgress.hasTarget ? monthlyPercentage : 0}%, color-mix(in oklch, var(--color-primary-foreground) 18%, transparent) 0)` }}
              role="img"
              aria-label={monthlyProgress.hasTarget ? `${monthlyPercentage.toFixed(0)}% de la meta mensual` : "Sin meta mensual definida"}
            >
              <div className="grid size-full place-items-center rounded-full bg-primary text-center">
                <div>
                  {monthlyProgress.hasTarget ? (
                    <>
                      <span className="block text-2xl font-semibold tabular-nums">{monthlyPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] uppercase tracking-wide text-primary-foreground/65">del objetivo</span>
                    </>
                  ) : (
                    <>
                      <Target className="mx-auto size-5 text-primary-foreground/80" />
                      <span className="mt-1 block text-[10px] leading-3 text-primary-foreground/70">sin objetivo</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground/65">Objetivo mensual</p>
              {monthlyProgress.hasTarget ? (
                <>
                  <p className="mt-1 truncate text-lg font-semibold tabular-nums">{formatCurrency(monthlyProgress.targetAmount)}</p>
                  <p className="mt-1 text-xs leading-5 text-primary-foreground/70">
                    {monthlyProgress.isComplete
                      ? "Objetivo alcanzado. Todo lo que ahorren ahora suma al siguiente paso."
                      : `Faltan ${formatCurrency(monthlyProgress.remaining)} para llegar.`}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-base font-semibold">Pongan un objetivo al mes</p>
                  <p className="mt-1 text-xs leading-5 text-primary-foreground/70">Un punto de referencia vuelve visible su progreso.</p>
                  <Button type="button" size="sm" variant="secondary" className="mt-2 h-8" onClick={() => setTargetModalOpen(true)}>Definir objetivo</Button>
                </>
              )}
              {monthlyProgress.hasTarget && (
                <button type="button" onClick={() => setTargetModalOpen(true)} className="mt-2 block text-xs font-semibold text-primary-foreground underline-offset-4 hover:underline">Editar objetivo</button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div className="space-y-6">
          {activeGoal ? (
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="primary-goal-heading">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Target className="size-4 text-primary" /> Meta principal</p>
                  <h2 id="primary-goal-heading" className="mt-1 text-xl font-semibold">{activeGoal.name}</h2>
                  {targetDateValue && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      {isTargetDatePast ? "Fecha objetivo superada" : `Objetivo: ${formatGoalDate(targetDateValue)}`}
                    </p>
                  )}
                </div>
                <Link href={`/metas/${activeGoal.id}`} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:underline">Ver meta <ArrowUpRight className="size-4" /></Link>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                <p className="text-3xl font-semibold tabular-nums tracking-tight">{formatCurrency(activeGoal.currentAmount)}</p>
                <p className="text-sm text-muted-foreground">de {formatCurrency(activeGoal.targetAmount)}</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Progreso de ${activeGoal.name}`} aria-valuenow={Math.min(100, Number(activeGoal.percentage))} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-[width] duration-700 ${activeGoal.isComplete ? "bg-success" : "bg-secondary"}`} style={{ width: `${Math.min(100, Number(activeGoal.percentage))}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">{Number(activeGoal.percentage).toFixed(0)}% completado</span>
                <span className="tabular-nums text-muted-foreground">{activeGoal.isComplete ? "Meta alcanzada" : `Faltan ${formatCurrency(activeGoal.remaining)}`}</span>
              </div>

              {!activeGoal.isComplete && (
                <div className="mt-6 border-t border-border pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4 text-primary" /> Simula su ritmo</p>
                      <p className="mt-1 text-xs text-muted-foreground">Ajusta un aporte semanal y mira el tiempo estimado.</p>
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                      <span className="text-xs text-muted-foreground">L</span>
                      <input
                        type="number"
                        min={50}
                        max={5000}
                        step={50}
                        value={weeklyPlan}
                        onChange={(event) => setWeeklyPlan(Math.max(50, Math.min(5000, Number(event.target.value) || 50)))}
                        aria-label="Aporte semanal simulado en lempiras"
                        className="w-24 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
                      />
                      <span className="text-xs text-muted-foreground">/ semana</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={5000}
                    step={50}
                    value={weeklyPlan}
                    onChange={(event) => setWeeklyPlan(Number(event.target.value))}
                    aria-label="Ajustar aporte semanal simulado"
                    className="mt-4 h-2 w-full cursor-pointer accent-primary"
                  />
                  <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Con {formatCurrency(weeklyPlan)} por semana</p>
                      <p className="mt-0.5 text-sm font-semibold">Aproximadamente {formatCurrency(monthlyEquivalent)} al mes</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CalendarClock className="size-4" />
                      {projectedWeeks === null
                        ? "Sin estimación"
                        : projectedWeeks > 2600
                          ? "Más de 50 años"
                          : `${projectedWeeks} ${projectedWeeks === 1 ? "semana" : "semanas"} · aprox. ${Math.max(1, Math.ceil(projectedWeeks / 4.33))} ${Math.ceil(projectedWeeks / 4.33) === 1 ? "mes" : "meses"}${projectedDate ? ` · ${projectedDate}` : ""}`}
                    </div>
                  </div>
                  {targetDateValue && (
                    <p className={`mt-3 flex items-start gap-2 text-xs leading-5 ${isTargetDatePast ? "text-warning-foreground" : canReachTargetDate ? "text-success" : "text-warning-foreground"}`}>
                      {isTargetDatePast ? (
                        <><CalendarClock className="mt-0.5 size-3.5 shrink-0" />La fecha objetivo ya pasó; actualícenla para comparar un nuevo plan.</>
                      ) : canReachTargetDate ? (
                        <><TrendingUp className="mt-0.5 size-3.5 shrink-0" />Con este ritmo, podrían alcanzar la meta dentro de la fecha prevista.</>
                      ) : (
                        <><ArrowRight className="mt-0.5 size-3.5 shrink-0" />Con este ritmo, la proyección rebasa la fecha objetivo. Ajusten el aporte semanal para acercarla.</>
                      )}
                    </p>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <p className="flex items-center gap-2 font-semibold"><Target className="size-4 text-primary" /> Elijan un objetivo para avanzar juntos</p>
                <p className="mt-1 text-sm text-muted-foreground">Su primera meta puede ser pequeña; lo importante es empezar.</p>
              </div>
              <Link href="/metas" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Crear meta <ArrowRight className="size-4" /></Link>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card" aria-labelledby="recent-activity-heading">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">En movimiento</p>
                <h2 id="recent-activity-heading" className="mt-0.5 font-semibold">Actividad reciente</h2>
              </div>
              <Link href="/actividad" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver todo <ArrowRight className="size-4" /></Link>
            </div>
            {recentContributions.length ? (
              <div className="divide-y divide-border px-5">
                {recentContributions.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-4">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{item.user.name.slice(0, 1).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5"><span className="font-semibold">{item.user.name}</span> aportó <span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span></p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{formatDateShort(new Date(item.contributionDate))}</span>
                        {item.goal && <><span aria-hidden="true">·</span><Link href={`/metas/${item.goal.id}`} className="truncate hover:text-primary hover:underline">{item.goal.name}</Link></>}
                        {item.note && <><span aria-hidden="true">·</span><span className="truncate">{item.note}</span></>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <HandCoins className="mx-auto size-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">Todavía no hay aportes</p>
                <p className="mt-1 text-xs text-muted-foreground">Su primer movimiento aparecerá aquí.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="monthly-effort-heading">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ritmo compartido</p>
                <h2 id="monthly-effort-heading" className="mt-1 font-semibold">Aportes de este mes</h2>
              </div>
              <div className="grid size-9 place-items-center rounded-lg bg-secondary/20 text-secondary-foreground"><HandCoins className="size-4" /></div>
            </div>
            {memberTotals.length ? (
              <div className="mt-5 space-y-4">
                {memberTotals.map((member, index) => {
                  const share = totalMembers > 0 ? (Number(member.total) / totalMembers) * 100 : 0;
                  return (
                    <div key={member.userId}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{member.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(member.total)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-[width] duration-500 ${index === 0 ? "bg-primary" : "bg-secondary"}`} style={{ width: `${share}%` }} /></div>
                      <p className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">{share.toFixed(0)}% del ahorro mensual</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Cuando registren aportes, verán aquí cómo avanza cada uno.</p>
            )}
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Total compartido</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(monthlySaved)}</p>
            </div>
          </section>

          <section className="border-l-2 border-secondary pl-4 py-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Un dato para hoy</p>
            <p className="mt-2 text-sm leading-6">
              {monthlyProgress.isComplete
                ? "Ya alcanzaron el objetivo del mes. Pueden adelantar su siguiente meta."
                : monthlyProgress.hasTarget
                  ? `Si mantienen el ritmo, todavía pueden sumar ${formatCurrency(monthlyProgress.remaining)} para alcanzar el objetivo mensual.`
                  : "Definir un objetivo mensual les dará un ritmo concreto para construir el ahorro."}
            </p>
            <Link href={monthlyProgress.hasTarget ? "/estadisticas" : "/metas"} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              {monthlyProgress.hasTarget ? "Explorar estadísticas" : "Definir una meta"} <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </aside>
      </section>

      <footer className="flex flex-col justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">{activeGoalsCount} {activeGoalsCount === 1 ? "meta activa" : "metas activas"}{completedGoalsCount ? ` · ${completedGoalsCount} ${completedGoalsCount === 1 ? "completada" : "completadas"}` : ""}</p>
        <Link href="/metas" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver todas las metas <ArrowUpRight className="size-4" /></Link>
      </footer>

      <MonthlyTargetModal
        open={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSuccess={handleTargetSuccess}
        year={monthlyProgress.year}
        month={monthlyProgress.month}
        initialAmount={monthlyProgress.hasTarget ? monthlyProgress.targetAmount : undefined}
        title={monthlyProgress.hasTarget ? "Editar objetivo mensual" : "Establecer objetivo mensual"}
        submitLabel={monthlyProgress.hasTarget ? "Guardar cambios" : "Establecer objetivo"}
        pendingLabel={monthlyProgress.hasTarget ? "Guardando..." : "Estableciendo..."}
      />
    </div>
  );
}

function getProjectedDate(weeksFromNow: number) {
  const [year, month, day] = getIsoDateInAppTimezone().split("-").map(Number);
  const projected = new Date(Date.UTC(year, month - 1, day + weeksFromNow * 7));
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(projected);
}

function getWeeksUntilTarget(targetDate: string) {
  const today = getIsoDateInAppTimezone();
  const targetTime = Date.parse(`${targetDate}T00:00:00.000Z`);
  const todayTime = Date.parse(`${today}T00:00:00.000Z`);
  const daysUntilTarget = Math.floor((targetTime - todayTime) / 86_400_000);
  return Math.max(0, Math.floor(daysUntilTarget / 7));
}

function formatGoalDate(targetDate: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${targetDate}T00:00:00.000Z`));
}