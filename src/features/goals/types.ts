import type { Prisma } from "@prisma/client";
import type { SavingsGoalStatus } from "@prisma/client";

/**
 * Versión serializable de una meta para pasar de Server a Client Components.
 * Los Decimal se pasan como string para preservar precisión.
 * Las fechas se pasan como ISO string.
 */
export interface SerializableGoal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: string;
  targetDate: string | null;
  status: SavingsGoalStatus;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Meta con progreso calculado. Serializable.
 */
export interface SerializableGoalWithProgress extends SerializableGoal {
  currentAmount: string;
  remaining: string;
  percentage: string;
  isComplete: boolean;
}

export function serializeGoal(goal: {
  id: string;
  name: string;
  description: string | null;
  targetAmount: Prisma.Decimal;
  targetDate: Date | null;
  status: SavingsGoalStatus;
  completedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SerializableGoal {
  return {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    targetAmount: goal.targetAmount.toFixed(2),
    targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
    status: goal.status,
    completedAt: goal.completedAt ? goal.completedAt.toISOString() : null,
    archivedAt: goal.archivedAt ? goal.archivedAt.toISOString() : null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}