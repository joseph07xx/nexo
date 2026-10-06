import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NexoLogo } from "@/components/brand/nexo-logo";
import { ArrowRight, Info, Target } from "lucide-react";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { ContributionSummary } from "@/features/contributions/components/contribution-summary";
import {
  getDashboardTotals,
  getRecentContributions,
} from "@/features/contributions/data";
import {
  getPrimaryGoalWithProgress,
  getActiveGoalsForSelect,
  countGoalsByStatus,
} from "@/features/goals/data";
import { calculateGoalProgress } from "@/services/goals";
import { formatCurrency, formatDateShort } from "@/utils/format-currency";

export default async function InicioPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasCouple = !!session.user.coupleId;
  const userName = session.user.name ?? "Usuario";
  const firstName = userName.split(" ")[0];

  if (!hasCouple || !session.user.coupleId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">
            Buenos días, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aún no tienes pareja en NEXO
          </p>
        </header>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">Aún no tienes pareja en NEXO.</p>
            <Link
              href="/perfil"
              className="text-sm font-medium text-primary hover:underline"
            >
              Creen una para empezar a ahorrar juntos →
            </Link>
          </div>
        </div>

        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="pt-6">
            <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
              Nuestro ahorro
            </p>
            <p className="text-4xl font-bold tabular-nums mt-1">L 0.00</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coupleId = session.user.coupleId;

  const [totals, recent, primaryGoalData, goalOptions, goalCounts] = await Promise.all([
    getDashboardTotals(coupleId),
    getRecentContributions(coupleId, 5),
    getPrimaryGoalWithProgress(coupleId),
    getActiveGoalsForSelect(coupleId),
    countGoalsByStatus(coupleId),
  ]);

  // Calcular progreso de la meta principal
  let primaryGoal: {
    name: string;
    currentAmount: string;
    targetAmount: string;
    percentage: string;
    remaining: string;
    isComplete: boolean;
  } | null = null;

  if (primaryGoalData) {
    const progress = calculateGoalProgress(
      primaryGoalData.currentAmount,
      primaryGoalData.goal.targetAmount
    );

    primaryGoal = {
      name: primaryGoalData.goal.name,
      currentAmount: primaryGoalData.currentAmount.toFixed(2),
      targetAmount: primaryGoalData.goal.targetAmount.toFixed(2),
      percentage: progress.percentage.toFixed(2),
      remaining: progress.remaining.toFixed(2),
      isComplete: progress.isComplete,
    };
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <NexoLogo size={32} className="lg:hidden shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              Buenos días, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Este mes llevan {formatCurrency(totals.totalThisMonth)}
            </p>
          </div>
        </div>
      </header>

      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="pt-6">
          <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
            Nuestro ahorro
          </p>
          <p className="text-4xl font-bold tabular-nums mt-1">
            {formatCurrency(totals.totalAllTime)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
            <span>Este mes: {formatCurrency(totals.totalThisMonth)}</span>
          </div>
        </CardContent>
      </Card>

      {totals.byUserThisMonth.length > 0 && (
        <ContributionSummary
          total={totals.totalThisMonth.toFixed(2)}
          byUser={totals.byUserThisMonth.map((u) => ({
            userId: u.userId,
            name: u.name,
            total: u.total.toFixed(2),
          }))}
        />
      )}

      {/* Meta principal */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Meta principal</CardTitle>
          <Link href="/metas" className="text-xs text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent>
          {primaryGoal ? (
            <>
              <p className="font-medium mb-1">{primaryGoal.name}</p>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(primaryGoal.currentAmount)}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  / {formatCurrency(primaryGoal.targetAmount)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    primaryGoal.isComplete ? "bg-success" : "bg-secondary"
                  }`}
                  style={{
                    width: `${Math.min(100, Number(primaryGoal.percentage))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {Math.min(100, Number(primaryGoal.percentage)).toFixed(0)}%
                </span>
                {primaryGoal.isComplete ? (
                  <span className="text-success font-medium">Meta alcanzada</span>
                ) : (
                  <span>Faltan {formatCurrency(primaryGoal.remaining)}</span>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Target className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no tienen metas activas
              </p>
              <Link
                href="/metas"
                className="text-sm text-primary hover:underline mt-1"
              >
                Crear su primera meta →
              </Link>
            </div>
          )}

          {goalCounts.active > 0 && (
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
              {goalCounts.active} {goalCounts.active === 1 ? "meta activa" : "metas activas"}
              {goalCounts.completed > 0 && (
                <> · {goalCounts.completed} {goalCounts.completed === 1 ? "completada" : "completadas"}</>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actividad reciente */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <Link
            href="/actividad"
            className="text-xs text-primary hover:underline"
          >
            Ver todo
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Todavía no hay aportes registrados
            </p>
          ) : (
            recent.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.user.name}</span>
                    {" aportó "}
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateShort(item.contributionDate)}
                    {item.goal && ` · ${item.goal.name}`}
                    {item.note && ` · ${item.note}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CreateContributionButton
        className="w-full"
        goalOptions={goalOptions}
      />
    </div>
  );
}