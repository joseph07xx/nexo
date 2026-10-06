import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";
import { getStatsData } from "@/features/stats/data";
import {
  aggregateByUser,
  calculateTotal,
  countContributions,
  countActiveMonths,
  calculateMonthlyAverage,
  findBestAndWorstMonths,
  calculateCumulative,
  calculateGoalCompletion,
  buildMonthlyChartData,
} from "@/services/stats";
import { StatsSummary } from "@/features/stats/components/stats-summary";
import { MonthlyProgressChart } from "@/features/stats/components/monthly-progress-chart";
import { UserDistributionChart } from "@/features/stats/components/user-distribution-chart";
import { BestWorstMonths } from "@/features/stats/components/best-worst-months";
import { CumulativeChart } from "@/features/stats/components/cumulative-chart";
import { GoalCompletionCard } from "@/features/stats/components/goal-completion-card";
import type { StatsData } from "@/features/stats/types";
import { Prisma } from "@prisma/client";

export default async function EstadisticasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasCouple = !!session.user.coupleId;

  if (!hasCouple || !session.user.coupleId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis de su progreso compartido
          </p>
        </header>

        <Card>
          <CardContent>
            <NoCoupleEmptyState
              icon={BarChart3}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para ver las estadísticas compartidas."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const coupleId = session.user.coupleId;

  const { contributions, targets, members } = await getStatsData(coupleId);

  const hasContributions = contributions.length > 0;
  const hasTargets = targets.length > 0;

  // ============================================
  // ESTADO VACÍO GENERAL
  // ============================================

  if (!hasContributions) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis de su progreso compartido
          </p>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="size-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium">Aún no hay datos suficientes</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Registren su primer aporte para empezar a ver estadísticas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // CÁLCULOS
  // ============================================

  const totalAllTime = calculateTotal(contributions);
  const monthlyAverage = calculateMonthlyAverage(contributions);
  const activeMonths = countActiveMonths(contributions);
  const contributionsCount = countContributions(contributions);

  const byUserMap = aggregateByUser(contributions);
  const totalForDistribution = totalAllTime;

  const userDistribution = members.map((m) => {
    const userTotal = byUserMap.get(m.userId) ?? new Prisma.Decimal(0);
    const percentage = totalForDistribution.greaterThan(0)
      ? userTotal.dividedBy(totalForDistribution).times(100).toDecimalPlaces(2)
      : new Prisma.Decimal(0);

    return {
      userId: m.userId,
      name: m.user.name,
      total: userTotal.toFixed(2),
      percentage: percentage.toFixed(2),
    };
  });

  const { best, worst } = findBestAndWorstMonths(contributions);

  const cumulative = calculateCumulative(contributions);

  const goalCompletion = calculateGoalCompletion(
    contributions,
    targets.map((t) => ({
      year: t.year,
      month: t.month,
      targetAmount: t.targetAmount,
    }))
  );

  const monthlyChart = buildMonthlyChartData(
    contributions,
    targets.map((t) => ({
      year: t.year,
      month: t.month,
      targetAmount: t.targetAmount,
    })),
    6
  );

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  const statsData: StatsData = {
    summary: {
      totalAllTime: totalAllTime.toFixed(2),
      monthlyAverage: monthlyAverage.toFixed(2),
      activeMonths,
      contributionsCount,
    },
    monthlyChart: monthlyChart.map((p) => ({
      key: p.key,
      year: p.year,
      month: p.month,
      total: p.total.toFixed(2),
      target: p.target ? p.target.toFixed(2) : null,
    })),
    userDistribution,
    bestMonth: best
      ? {
          key: best.key,
          year: best.year,
          month: best.month,
          total: best.total.toFixed(2),
        }
      : null,
    worstMonth: worst
      ? {
          key: worst.key,
          year: worst.year,
          month: worst.month,
          total: worst.total.toFixed(2),
        }
      : null,
    cumulative: cumulative.map((c) => ({
      key: c.key,
      year: c.year,
      month: c.month,
      monthly: c.monthly.toFixed(2),
      cumulative: c.cumulative.toFixed(2),
    })),
    goalCompletion: {
      completed: goalCompletion.completed,
      total: goalCompletion.total,
      percentage: goalCompletion.percentage.toFixed(2),
    },
    hasContributions,
    hasTargets,
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Análisis de su progreso compartido
        </p>
      </header>

      <StatsSummary summary={statsData.summary} />

      <GoalCompletionCard completion={statsData.goalCompletion} />

      <MonthlyProgressChart data={statsData.monthlyChart} />

      <BestWorstMonths
        best={statsData.bestMonth}
        worst={statsData.worstMonth}
      />

      <UserDistributionChart distribution={statsData.userDistribution} />

      <CumulativeChart data={statsData.cumulative} />
    </div>
  );
}