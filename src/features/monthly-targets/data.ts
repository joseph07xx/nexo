import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getMonthRange } from "@/services/monthly-target";

// ============================================
// CONSULTAS
// ============================================

/**
 * Obtiene el objetivo mensual de una pareja para un año/mes concreto.
 *
 * No verifica autorización. Esa responsabilidad es de la Server Action.
 */
export async function getMonthlyTarget(
  coupleId: string,
  year: number,
  month: number
) {
  return prisma.monthlyTarget.findUnique({
    where: {
      coupleId_year_month: {
        coupleId,
        year,
        month,
      },
    },
  });
}

/**
 * Suma de todos los aportes de una pareja dentro del mes dado.
 *
 * El mes se determina por `contributionDate`, no por `createdAt`.
 *
 * Incluye aportes con o sin meta, y metas en cualquier estado.
 */
export async function getMonthlySavedTotal(
  coupleId: string,
  year: number,
  month: number
): Promise<Prisma.Decimal> {
  const { start, end } = getMonthRange(year, month);

  const result = await prisma.savingsContribution.aggregate({
    where: {
      coupleId,
      contributionDate: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? new Prisma.Decimal(0);
}

// ============================================
// MUTACIONES
// ============================================

export interface UpsertMonthlyTargetData {
  coupleId: string;
  year: number;
  month: number;
  targetAmount: Prisma.Decimal;
}

/**
 * Crea o actualiza el objetivo mensual de una pareja para un mes concreto.
 *
 * Usa `upsert` con la clave compuesta `coupleId_year_month`.
 *
 * Si el registro no existe: lo crea.
 * Si ya existe: actualiza `targetAmount` y `updatedAt`.
 *
 * NUNCA elimina el registro.
 */
export async function upsertMonthlyTarget(data: UpsertMonthlyTargetData) {
  return prisma.monthlyTarget.upsert({
    where: {
      coupleId_year_month: {
        coupleId: data.coupleId,
        year: data.year,
        month: data.month,
      },
    },
    create: {
      coupleId: data.coupleId,
      year: data.year,
      month: data.month,
      targetAmount: data.targetAmount,
    },
    update: {
      targetAmount: data.targetAmount,
    },
  });
}