import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowUpRight, CalendarDays, CircleCheck, Info, Target, TrendingUp } from "lucide-react";
import { getGoalWithProgress } from "@/features/goals/data";
import { calculateGoalProgress } from "@/services/goals";
import { serializeGoal } from "@/features/goals/types";
import { getIsoDateInAppTimezone, formatCurrency } from "@/utils/format-currency";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { getWithdrawalSources, listFinancialMovements } from "@/features/contributions/data";
import { serializeContribution, serializeWithdrawal } from "@/features/contributions/types";
import { WithdrawalButton } from "@/features/contributions/components/withdrawal-button";
import { ContributionList } from "@/features/contributions/components/contribution-list";
import { getActiveGoalsForSelect } from "@/features/goals/data";

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function GoalDetailPage({
  params,
  searchParams,
}: GoalDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.coupleId) {
    redirect("/metas");
  }

  const { id } = await params;

  const data = await getGoalWithProgress(id);

  if (!data || data.goal.coupleId !== session.user.coupleId) {
    notFound();
  }

  const { goal, currentAmount } = data;
  const progress = calculateGoalProgress(currentAmount, goal.targetAmount);
  const serializedGoal = serializeGoal(goal);

  const serializedGoalWithProgress = {
    ...serializedGoal,
    currentAmount: currentAmount.toFixed(2),
    remaining: progress.remaining.toFixed(2),
    percentage: progress.percentage.toFixed(2),
    isComplete: progress.isComplete,
  };

  const params2 = await searchParams;
  const page = Math.max(1, parseInt(params2.page ?? "1", 10) || 1);

  const [contributionsResult, goalOptions, withdrawalSources] = await Promise.all([
    listFinancialMovements({
      coupleId: session.user.coupleId,
      goalId: goal.id,
      page,
    }),
    getActiveGoalsForSelect(session.user.coupleId),
    getWithdrawalSources(session.user.coupleId),
  ]);

  const serializedMovements = contributionsResult.items.map((item) =>
    item.kind === "CONTRIBUTION"
      ? serializeContribution(item)
      : serializeWithdrawal(item)
  );

  const statusLabel: Record<typeof goal.status, string> = {
    ACTIVE: "Activa",
    COMPLETED: "Completada",
    ARCHIVED: "Archivada",
  };

  const statusColor: Record<typeof goal.status, string> = {
    ACTIVE: "bg-primary/10 text-primary",
    COMPLETED: "bg-success/10 text-success",
    ARCHIVED: "bg-muted text-muted-foreground",
  };

  const remaining = Number(serializedGoalWithProgress.remaining);
  const targetDateValue = serializedGoal.targetDate?.slice(0, 10) ?? null;
  const today = getIsoDateInAppTimezone();
  const todayParts = today.split("-").map(Number);
  const targetParts = targetDateValue?.split("-").map(Number);
  const isTargetDatePast = targetDateValue ? targetDateValue < today : false;
  const monthsToTarget = targetParts && !isTargetDatePast
    ? Math.max(1, (targetParts[0] - todayParts[0]) * 12 + targetParts[1] - todayParts[1])
    : null;
  const monthlyPace = monthsToTarget && remaining > 0
    ? remaining / monthsToTarget
    : 0;
  const targetDateLabel = targetDateValue
    ? new Intl.DateTimeFormat("es-HN", {
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${targetDateValue}T00:00:00.000Z`))
    : null;

  return (
    <div className="space-y-7 pb-8">
      <Link
        href="/metas"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a metas
      </Link>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary"><Target className="size-4" /> META COMPARTIDA</p>
          <h1 className="truncate text-3xl font-semibold tracking-tight">{goal.name}</h1>
          {goal.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{goal.description}</p>}
        </div>
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusColor[goal.status]}`}>{statusLabel[goal.status]}</span>
      </header>

      <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full border border-primary-foreground/10" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm text-primary-foreground/75"><TrendingUp className="size-4" /> Avance actual</p>
            <p className="mt-3 text-4xl font-semibold tabular-nums sm:text-5xl">{formatCurrency(serializedGoalWithProgress.currentAmount)}</p>
            <div className="mt-5 max-w-xl">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-primary-foreground/75">
                <span>Meta de {formatCurrency(serializedGoalWithProgress.targetAmount)}</span>
                <span className="font-semibold tabular-nums text-primary-foreground">{Number(serializedGoalWithProgress.percentage).toFixed(0)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-primary-foreground/15" role="progressbar" aria-label="Progreso de la meta" aria-valuenow={Math.min(100, Number(serializedGoalWithProgress.percentage))} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-secondary transition-[width] duration-700" style={{ width: `${Math.min(100, Number(serializedGoalWithProgress.percentage))}%` }} />
              </div>
            </div>
            <p className="mt-3 text-sm text-primary-foreground/75">
              {serializedGoalWithProgress.isComplete ? "Objetivo alcanzado. ¡Lo construyeron juntos!" : `Faltan ${formatCurrency(serializedGoalWithProgress.remaining)} para completar esta meta.`}
            </p>
          </div>
          <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.08] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary-foreground/65">Su siguiente paso</p>
            {goal.status === "ACTIVE" && remaining > 0 ? (
              <>
                {targetDateLabel ? (
                  <>
                    <p className="mt-2 flex items-center gap-2 text-sm text-primary-foreground/75"><CalendarDays className="size-4" /> {isTargetDatePast ? "Fecha superada:" : "Fecha objetivo:"} {targetDateLabel}</p>
                    {isTargetDatePast ? (
                      <p className="mt-4 text-sm leading-5 text-primary-foreground/75">Actualicen la fecha objetivo para calcular un nuevo ritmo de ahorro.</p>
                    ) : (
                      <>
                        <p className="mt-4 text-2xl font-semibold tabular-nums">{formatCurrency(monthlyPace)}<span className="ml-1 text-sm font-medium text-primary-foreground/70">/ mes</span></p>
                        <p className="mt-1 text-xs leading-5 text-primary-foreground/65">A ese ritmo mensual podrían alcanzar la fecha objetivo.</p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-lg font-semibold">Pongan una fecha para este sueño.</p>
                    <p className="mt-1 text-sm leading-5 text-primary-foreground/70">Una fecha les ayuda a convertir el objetivo en un plan concreto.</p>
                  </>
                )}
              </>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-lg font-semibold"><CircleCheck className="size-5 text-success" /> Meta completada</p>
            )}
            {goal.status === "ACTIVE" && (
              <CreateContributionButton
                className="mt-5 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                label="Registrar aporte a esta meta"
                defaultGoalId={goal.id}
                goalOptions={goalOptions}
              />
            )}
            <WithdrawalButton
              sources={withdrawalSources}
              className="mt-2 w-full"
            />
          </div>
        </div>
      </section>

      {goal.status !== "ACTIVE" && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {goal.status === "COMPLETED"
              ? "Esta meta ya fue completada. No acepta nuevos aportes."
              : "Esta meta está archivada. Restáurala desde /metas para poder recibir nuevos aportes."}
          </p>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Libro de esta meta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Aportes y retiros que determinan el saldo disponible.</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">Mostrando {serializedMovements.length} de {contributionsResult.total}</span>
        </div>

        {serializedMovements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><TrendingUp className="size-5" /></div>
              <p className="mt-3 font-medium">El primer aporte abre el camino</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Cuando registren un aporte y lo vinculen a esta meta, aparecerá aquí.</p>
            </CardContent>
          </Card>
        ) : (
          <ContributionList
            initialItems={serializedMovements}
            currentUserId={session.user.id}
            totalPages={contributionsResult.totalPages}
            currentPage={contributionsResult.page}
            total={contributionsResult.total}
            pageSize={serializedMovements.length}
            paginationPath={`/metas/${goal.id}`}
          />
        )}
      </section>

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Info className="size-4 shrink-0" />Los aportes y retiros vinculados actualizan el saldo de esta meta.</p>
        <Link href="/actividad" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver toda la actividad <ArrowUpRight className="size-4" /></Link>
      </div>
    </div>
  );
}