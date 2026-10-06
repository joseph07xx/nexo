import type { Prisma } from "@prisma/client";

/**
 * Versión serializable del objetivo mensual para pasar de Server a Client Components.
 * El Decimal se pasa como string para preservar precisión.
 */
export interface SerializableMonthlyTarget {
  id: string;
  year: number;
  month: number;
  targetAmount: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Progreso mensual serializable.
 * Se usa en la card de /inicio.
 */
export interface SerializableMonthlyProgress {
  year: number;
  month: number;
  totalSaved: string;
  targetAmount: string;
  percentage: string;
  remaining: string;
  isComplete: boolean;
  hasTarget: boolean;
}

export function serializeMonthlyTarget(target: {
  id: string;
  year: number;
  month: number;
  targetAmount: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
}): SerializableMonthlyTarget {
  return {
    id: target.id,
    year: target.year,
    month: target.month,
    targetAmount: target.targetAmount.toFixed(2),
    createdAt: target.createdAt.toISOString(),
    updatedAt: target.updatedAt.toISOString(),
  };
}