import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Info } from "lucide-react";
import { getGoalWithProgress } from "@/features/goals/data";
import { calculateGoalProgress } from "@/services/goals";
import { serializeGoal } from "@/features/goals/types";
import { GoalProgress } from "@/features/goals/components/goal-progress";
import { formatDateLong } from "@/utils/format-currency";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { listContributions } from "@/features/contributions/data";
import { serializeContribution } from "@/features/contributions/types";
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

  const [contributionsResult, goalOptions] = await Promise.all([
    listContributions({
      coupleId: session.user.coupleId,
      page,
    }),
    getActiveGoalsForSelect(session.user.coupleId),
  ]);

  const goalContributions = contributionsResult.items.filter(
    (c) => c.goalId === goal.id
  );

  const serializedContributions = goalContributions.map(serializeContribution);

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

  return (
    <div className="space-y-6">
      <Link
        href="/metas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver a metas
      </Link>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {goal.name}
            </h1>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {goal.description}
              </p>
            )}
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
              statusColor[goal.status]
            }`}
          >
            {statusLabel[goal.status]}
          </span>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <GoalProgress
            currentAmount={serializedGoalWithProgress.currentAmount}
            targetAmount={serializedGoalWithProgress.targetAmount}
            remaining={serializedGoalWithProgress.remaining}
            percentage={serializedGoalWithProgress.percentage}
            isComplete={serializedGoalWithProgress.isComplete}
            variant="full"
          />

          {goal.targetDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border">
              <Calendar className="size-4" />
              <span>Fecha objetivo: {formatDateLong(goal.targetDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {goal.status === "ACTIVE" && (
        <CreateContributionButton
          className="w-full"
          label="Registrar aporte a esta meta"
          defaultGoalId={goal.id}
          goalOptions={goalOptions}
        />
      )}

      {goal.status !== "ACTIVE" && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 flex items-start gap-3">
          <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {goal.status === "COMPLETED"
              ? "Esta meta ya fue completada. No acepta nuevos aportes."
              : "Esta meta está archivada. Restáurala desde /metas para poder recibir nuevos aportes."}
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">
          Aportes asociados
        </h2>

        {serializedContributions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay aportes asociados a esta meta.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ContributionList
            initialItems={serializedContributions}
            currentUserId={session.user.id}
            totalPages={1}
            currentPage={1}
            total={serializedContributions.length}
            pageSize={serializedContributions.length}
          />
        )}
      </section>
    </div>
  );
}