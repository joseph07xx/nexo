import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { MAX_ACTIVE_GOALS } from "@/services/goals";

// ============================================
// CONSULTAS
// ============================================

export interface ListGoalsOptions {
  coupleId: string;
  status?: "ACTIVE" | "COMPLETED" | "ARCHIVED" | "ALL";
}

/**
 * Lista metas de una pareja, opcionalmente filtradas por estado.
 * Ordenadas por createdAt DESC.
 */
export async function listGoalsByCouple({
  coupleId,
  status = "ACTIVE",
}: ListGoalsOptions) {
  return prisma.savingsGoal.findMany({
    where: {
      coupleId,
      ...(status === "ALL" ? {} : { status }),
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Obtiene una meta por ID.
 *
 * NO verifica autorización. Esa responsabilidad es de la Server Action.
 */
export async function getGoalById(id: string) {
  return prisma.savingsGoal.findUnique({
    where: { id },
  });
}

/**
 * Cuenta metas ACTIVE de una pareja.
 */
export async function countActiveGoals(coupleId: string) {
  return prisma.savingsGoal.count({
    where: { coupleId, status: "ACTIVE" },
  });
}

/**
 * Obtiene las metas ACTIVE de una pareja (para el select de aportes).
 */
export async function getActiveGoalsForSelect(coupleId: string) {
  return prisma.savingsGoal.findMany({
    where: { coupleId, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Obtiene metas con su progreso actual.
 *
 * Usa una query para las metas + una query agrupada para los aportes.
 * No hay N+1.
 *
 * Devuelve metas ordenadas por createdAt DESC.
 */
export async function getGoalsWithProgress(
  coupleId: string,
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED"
) {
  const goals = await prisma.savingsGoal.findMany({
    where: { coupleId, status },
    orderBy: { createdAt: "desc" },
  });

  if (goals.length === 0) {
    return [];
  }

  const goalIds = goals.map((g) => g.id);

  const totals = await prisma.savingsContribution.groupBy({
    by: ["goalId"],
    where: {
      coupleId,
      goalId: { in: goalIds },
    },
    _sum: { amount: true },
  });

  const totalMap = new Map<string, Prisma.Decimal>();
  for (const t of totals) {
    if (t.goalId && t._sum.amount) {
      totalMap.set(t.goalId, t._sum.amount);
    }
  }

  return goals.map((goal) => ({
    goal,
    currentAmount: totalMap.get(goal.id) ?? new Prisma.Decimal(0),
  }));
}

/**
 * Obtiene el progreso de una sola meta.
 */
export async function getGoalWithProgress(id: string) {
  const goal = await prisma.savingsGoal.findUnique({
    where: { id },
  });

  if (!goal) return null;

  const totals = await prisma.savingsContribution.aggregate({
    where: { goalId: id },
    _sum: { amount: true },
  });

  return {
    goal,
    currentAmount: totals._sum.amount ?? new Prisma.Decimal(0),
  };
}

// ============================================
// CONTEO PARA DASHBOARD
// ============================================

export async function countGoalsByStatus(coupleId: string) {
  const [active, completed, archived] = await Promise.all([
    prisma.savingsGoal.count({ where: { coupleId, status: "ACTIVE" } }),
    prisma.savingsGoal.count({ where: { coupleId, status: "COMPLETED" } }),
    prisma.savingsGoal.count({ where: { coupleId, status: "ARCHIVED" } }),
  ]);

  return { active, completed, archived };
}

/**
 * Obtiene la primera meta ACTIVE (por createdAt DESC) para el dashboard.
 * Es la "meta principal" mientras no exista el concepto `isPrimary`.
 */
export async function getPrimaryGoalWithProgress(coupleId: string) {
  const goal = await prisma.savingsGoal.findFirst({
    where: { coupleId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!goal) return null;

  const totals = await prisma.savingsContribution.aggregate({
    where: { goalId: goal.id },
    _sum: { amount: true },
  });

  return {
    goal,
    currentAmount: totals._sum.amount ?? new Prisma.Decimal(0),
  };
}

// ============================================
// MUTACIONES
// ============================================

export interface CreateGoalData {
  coupleId: string;
  name: string;
  description?: string;
  targetAmount: Prisma.Decimal;
  targetDate?: Date | null;
}

/**
 * Crea una meta con protección atómica contra el límite de 10 activas.
 *
 * Estrategia:
 * 1. Advisory lock por coupleId (serializa todas las creaciones de esa pareja).
 * 2. Count de metas ACTIVE.
 * 3. Si count >= 10, lanza GOAL_LIMIT_REACHED.
 * 4. Si no, crea la meta.
 *
 * El advisory lock se libera automáticamente al terminar la transacción.
 * Parejas distintas no se bloquean entre sí.
 */
export async function createGoalWithLimitCheck(data: CreateGoalData) {
  return prisma.$transaction(async (tx) => {
    // Serializa creación de metas para esta pareja
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.coupleId}))`;

    const activeCount = await tx.savingsGoal.count({
      where: { coupleId: data.coupleId, status: "ACTIVE" },
    });

    if (activeCount >= MAX_ACTIVE_GOALS) {
      throw new Error("GOAL_LIMIT_REACHED");
    }

    return tx.savingsGoal.create({
      data: {
        coupleId: data.coupleId,
        name: data.name,
        description: data.description ?? null,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate ?? null,
        status: "ACTIVE",
      },
    });
  });
}

export interface UpdateGoalData {
  id: string;
  name: string;
  description?: string;
  targetAmount: Prisma.Decimal;
  targetDate?: Date | null;
}

/**
 * Actualiza una meta. No valida estado ni autorización.
 * Eso lo hace la Server Action.
 */
export async function updateGoal(data: UpdateGoalData) {
  return prisma.savingsGoal.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description ?? null,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate ?? null,
    },
  });
}

/**
 * Archiva una meta.
 */
export async function archiveGoal(id: string) {
  return prisma.savingsGoal.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });
}

/**
 * Restaura una meta archivada a ACTIVE.
 * Limpia `archivedAt` pero no `completedAt` (que está en null por definición).
 */
export async function unarchiveGoal(id: string) {
  return prisma.savingsGoal.update({
    where: { id },
    data: {
      status: "ACTIVE",
      archivedAt: null,
    },
  });
}

// ============================================
// RECONCILIACIÓN DE ESTADO (para aportes)
// ============================================

/**
 * Recalcula el estado de una meta a partir de sus aportes.
 *
 * Se llama DESPUÉS de crear/editar/eliminar un aporte asociado a la meta.
 * Debe ejecutarse dentro de la misma transacción del cambio de aporte.
 *
 * Reglas:
 * - Si status es ARCHIVED: no tocar.
 * - Si current >= target y status es ACTIVE: pasa a COMPLETED.
 * - Si current < target y status es COMPLETED: vuelve a ACTIVE y limpia completedAt.
 * - Si no cambia el estado: no hacer UPDATE innecesario.
 */
export async function reconcileGoalStatus(
  tx: Prisma.TransactionClient,
  goalId: string
): Promise<void> {
  const goal = await tx.savingsGoal.findUnique({
    where: { id: goalId },
    select: { id: true, status: true, targetAmount: true },
  });

  if (!goal) return;

  // Una meta archivada no se reactiva automáticamente
  if (goal.status === "ARCHIVED") return;

  const totals = await tx.savingsContribution.aggregate({
    where: { goalId },
    _sum: { amount: true },
  });

  const current = totals._sum.amount ?? new Prisma.Decimal(0);
  const isComplete = current.greaterThanOrEqualTo(goal.targetAmount);

  if (isComplete && goal.status === "ACTIVE") {
    await tx.savingsGoal.update({
      where: { id: goalId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    return;
  }

  if (!isComplete && goal.status === "COMPLETED") {
    await tx.savingsGoal.update({
      where: { id: goalId },
      data: {
        status: "ACTIVE",
        completedAt: null,
      },
    });
    return;
  }

  // Sin cambio de estado
}