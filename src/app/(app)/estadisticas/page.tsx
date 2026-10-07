import Link from "next/link";
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
import { StatsDashboard } from "@/features/stats/components/stats-dashboard";
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

  const { contributions, movements, targets, members } = await getStatsData(coupleId);

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

        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="size-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium">Aún no hay datos suficientes</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Registren su primer aporte para empezar a ver estadísticas.
            </p>

            <div className="mt-6 grid w-full max-w-xl gap-3 sm:grid-cols-3">
              <Link
                href="/actividad"
                className="rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted"
              >
                <p className="text-sm font-medium">Registrar aporte</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Añade el primer ahorro.
                </p>
              </Link>
              <Link
                href="/metas"
                className="rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted"
              >
                <p className="text-sm font-medium">Crear meta</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Define un objetivo real.
                </p>
              </Link>
              <Link
                href="/perfil"
                className="rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted"
              >
                <p className="text-sm font-medium">Configurar pareja</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Coordina el ahorro juntos.
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // CÁLCULOS
  // ============================================

  const totalAllTime = calculateTotal(movements);
  const monthlyAverage = calculateMonthlyAverage(movements);
  const activeMonths = countActiveMonths(movements);
  const contributionsCount = countContributions(contributions);

  const byUserMap = aggregateByUser(contributions);
  const totalForDistribution = calculateTotal(contributions);

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

  const { best, worst } = findBestAndWorstMonths(movements);

  const cumulative = calculateCumulative(movements);

  const goalCompletion = calculateGoalCompletion(
    movements,
    targets.map((t) => ({
      year: t.year,
      month: t.month,
      targetAmount: t.targetAmount,
    }))
  );

  const monthlyChart = buildMonthlyChartData(
    movements,
    targets.map((t) => ({
      year: t.year,
      month: t.month,
      targetAmount: t.targetAmount,
    })),
    120
  );

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  const bestMonthLabel = best
    ? `${best.month.toString().padStart(2, "0")}/${best.year}`
    : null;

  const consistencyScore = Math.min(
    100,
    Math.round((Math.min(activeMonths, 12) / 12) * 100)
  );

  const recommendation =
    consistencyScore >= 70
      ? "Mantienen un patrón de ahorro muy constante. Sigan aportando en la misma frecuencia para sostener el crecimiento."
      : "El hábito de ahorro aún es irregular. Un aporte semanal fijo puede ayudar a mantener la constancia y evitar picos de esfuerzo.";

  const statsData: StatsData = {
    summary: {
      totalAllTime: totalAllTime.toFixed(2),
      monthlyAverage: monthlyAverage.toFixed(2),
      activeMonths,
      contributionsCount,
    },
    habitSummary: {
      bestMonthLabel: bestMonthLabel,
      averageMonthlyContribution: monthlyAverage.toFixed(2),
      consistencyScore,
      recommendation,
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

  return (
    <StatsDashboard data={statsData} />
  );
}