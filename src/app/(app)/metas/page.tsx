import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";
import { getGoalsWithProgress } from "@/features/goals/data";
import { calculateGoalProgress } from "@/services/goals";
import { serializeGoal } from "@/features/goals/types";
import { GoalsWorkspace } from "@/features/goals/components/goals-workspace";

export default async function MetasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasCouple = !!session.user.coupleId;

  if (!hasCouple || !session.user.coupleId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Metas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sus objetivos de ahorro compartidos
          </p>
        </header>

        <Card>
          <CardContent>
            <NoCoupleEmptyState
              icon={Target}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para empezar a definir metas compartidas."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const coupleId = session.user.coupleId;

  const [activeGoals, completedGoals, archivedGoals] = await Promise.all([
    getGoalsWithProgress(coupleId, "ACTIVE"),
    getGoalsWithProgress(coupleId, "COMPLETED"),
    getGoalsWithProgress(coupleId, "ARCHIVED"),
  ]);

  // Serializar con progreso calculado
  const activeSerialized = activeGoals.map((item) => {
    const progress = calculateGoalProgress(
      item.currentAmount,
      item.goal.targetAmount
    );

    return {
      ...serializeGoal(item.goal),
      currentAmount: item.currentAmount.toFixed(2),
      remaining: progress.remaining.toFixed(2),
      percentage: progress.percentage.toFixed(2),
      isComplete: progress.isComplete,
    };
  });

  const completedSerialized = completedGoals.map((item) => {
    const progress = calculateGoalProgress(
      item.currentAmount,
      item.goal.targetAmount
    );

    return {
      ...serializeGoal(item.goal),
      currentAmount: item.currentAmount.toFixed(2),
      remaining: progress.remaining.toFixed(2),
      percentage: progress.percentage.toFixed(2),
      isComplete: progress.isComplete,
    };
  });

  const archivedSerialized = archivedGoals.map((item) => {
    const progress = calculateGoalProgress(
      item.currentAmount,
      item.goal.targetAmount
    );

    return {
      ...serializeGoal(item.goal),
      currentAmount: item.currentAmount.toFixed(2),
      remaining: progress.remaining.toFixed(2),
      percentage: progress.percentage.toFixed(2),
      isComplete: progress.isComplete,
    };
  });

  return (
    <GoalsWorkspace
      active={activeSerialized}
      completed={completedSerialized}
      archived={archivedSerialized}
    />
  );
}