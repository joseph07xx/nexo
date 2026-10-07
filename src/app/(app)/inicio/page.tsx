import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { HomeCockpit } from "@/features/home/components/home-cockpit";
import {
  getDashboardTotals,
  getRecentContributions,
} from "@/features/contributions/data";
import {
  getPrimaryGoalWithProgress,
  getActiveGoalsForSelect,
  countGoalsByStatus,
} from "@/features/goals/data";
import {
  getMonthlyTarget,
  getMonthlySavedTotal,
} from "@/features/monthly-targets/data";
import { calculateGoalProgress } from "@/services/goals";
import { calculateMonthlyProgress } from "@/services/monthly-target";
import { getGreetingForTime } from "@/utils/format-currency";

export default async function InicioPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const firstName = (session.user.name ?? "Usuario").split(" ")[0];
  const greeting = getGreetingForTime();
  const coupleId = session.user.coupleId;

  if (!coupleId) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">NEXO · TABLERO DEL HOGAR</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{greeting}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aún no tienes pareja en NEXO.</p>
        </header>
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm text-foreground">Crea o únete a una pareja para comenzar a ahorrar juntos.</p>
            <Link href="/perfil" className="mt-1 inline-block text-sm font-medium text-primary hover:underline">Configurar pareja <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <Card className="border-0 bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <p className="text-sm font-medium text-primary-foreground/75">Ahorro compartido</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">L 0.00</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [totals, recent, primaryGoalData, goalOptions, goalCounts, monthlyTarget, monthlySaved] = await Promise.all([
    getDashboardTotals(coupleId),
    getRecentContributions(coupleId, 5),
    getPrimaryGoalWithProgress(coupleId),
    getActiveGoalsForSelect(coupleId),
    countGoalsByStatus(coupleId),
    getMonthlyTarget(coupleId, currentYear, currentMonth),
    getMonthlySavedTotal(coupleId, currentYear, currentMonth),
  ]);

  const primaryGoal = primaryGoalData
    ? (() => {
        const progress = calculateGoalProgress(
          primaryGoalData.currentAmount,
          primaryGoalData.goal.targetAmount
        );

        return {
          id: primaryGoalData.goal.id,
          name: primaryGoalData.goal.name,
          currentAmount: primaryGoalData.currentAmount.toFixed(2),
          targetAmount: primaryGoalData.goal.targetAmount.toFixed(2),
          percentage: progress.percentage.toFixed(2),
          remaining: progress.remaining.toFixed(2),
          isComplete: progress.isComplete,
          targetDate: primaryGoalData.goal.targetDate?.toISOString() ?? null,
        };
      })()
    : null;

  const savedThisMonth = monthlySaved.toFixed(2);
  const monthlyProgress = monthlyTarget
    ? (() => {
        const progress = calculateMonthlyProgress(monthlySaved, monthlyTarget.targetAmount);
        return {
          year: currentYear,
          month: currentMonth,
          totalSaved: savedThisMonth,
          targetAmount: monthlyTarget.targetAmount.toFixed(2),
          percentage: progress.percentage.toFixed(2),
          remaining: progress.remaining.toFixed(2),
          isComplete: progress.isComplete,
          hasTarget: true,
        };
      })()
    : {
        year: currentYear,
        month: currentMonth,
        totalSaved: savedThisMonth,
        targetAmount: "0.00",
        percentage: "0.00",
        remaining: "0.00",
        isComplete: false,
        hasTarget: false,
      };

  return (
    <HomeCockpit
      greeting={greeting}
      firstName={firstName}
      totalAllTime={totals.totalAllTime.toFixed(2)}
      monthlySaved={savedThisMonth}
      monthlyProgress={monthlyProgress}
      activeGoal={primaryGoal}
      activeGoalsCount={goalCounts.active}
      completedGoalsCount={goalCounts.completed}
      goalOptions={goalOptions.map((goal) => ({ id: goal.id, name: goal.name }))}
      memberTotals={totals.byUserThisMonth.map((member) => ({
        userId: member.userId,
        name: member.name,
        total: member.total.toFixed(2),
      }))}
      recentContributions={recent.map((contribution) => ({
        id: contribution.id,
        amount: contribution.amount.toFixed(2),
        contributionDate: contribution.contributionDate.toISOString(),
        note: contribution.note,
        user: contribution.user,
        goal: contribution.goal
          ? { id: contribution.goal.id, name: contribution.goal.name }
          : null,
      }))}
    />
  );
}