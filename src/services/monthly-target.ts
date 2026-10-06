/**
 * Lógica de dominio para objetivos mensuales de ahorro.
 *
 * Reglas:
 * - NO accede a la base de datos.
 * - NO accede a la sesión.
 * - Todos los cálculos con Decimal.
 * - Testeable sin mocks.
 */

import { Prisma } from "@prisma/client";

// ============================================
// CONSTANTES
// ============================================

export const MAX_MONTHLY_TARGET = new Prisma.Decimal("999999999999.99");
export const MIN_MONTHLY_TARGET = new Prisma.Decimal("0.01");

// ============================================
// VALIDACIÓN DE AÑO Y MES
// ============================================

export type YearMonthValidation =
  | { valid: true }
  | { valid: false; reason: "INVALID_YEAR" | "INVALID_MONTH" };

export function isValidYearMonth(year: number, month: number): YearMonthValidation {
  if (!Number.isInteger(year) || year <= 0) {
    return { valid: false, reason: "INVALID_YEAR" };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, reason: "INVALID_MONTH" };
  }
  return { valid: true };
}

// ============================================
// VALIDACIÓN DE PERTENENCIA AL MES ACTUAL
// ============================================

export type CurrentMonthValidation =
  | { valid: true }
  | { valid: false; reason: "NOT_CURRENT_MONTH" };

/**
 * Verifica que el (year, month) sea el mes actual en hora local.
 *
 * Solo se permite crear/editar objetivos del mes actual.
 */
export function isCurrentMonth(
  year: number,
  month: number,
  now: Date = new Date()
): CurrentMonthValidation {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year !== currentYear || month !== currentMonth) {
    return { valid: false, reason: "NOT_CURRENT_MONTH" };
  }
  return { valid: true };
}

// ============================================
// CÁLCULO DE PROGRESO MENSUAL
// ============================================

export interface MonthlyProgress {
  /** Suma de aportes del mes. */
  totalSaved: Prisma.Decimal;
  /** Objetivo del mes. */
  target: Prisma.Decimal;
  /** Porcentaje real (puede ser >100). No se limita aquí. */
  percentage: Prisma.Decimal;
  /** True si totalSaved >= target. */
  isComplete: boolean;
  /** Cuánto falta. Nunca negativo. */
  remaining: Prisma.Decimal;
}

/**
 * Calcula el progreso mensual.
 *
 * @throws si target <= 0.
 */
export function calculateMonthlyProgress(
  totalSaved: Prisma.Decimal,
  target: Prisma.Decimal
): MonthlyProgress {
  if (target.lessThanOrEqualTo(0)) {
    throw new Error("El objetivo mensual debe ser mayor que cero");
  }

  const isComplete = totalSaved.greaterThanOrEqualTo(target);

  const remaining = isComplete
    ? new Prisma.Decimal(0)
    : target.minus(totalSaved);

  const percentage = totalSaved
    .dividedBy(target)
    .times(100)
    .toDecimalPlaces(2);

  return {
    totalSaved,
    target,
    percentage,
    isComplete,
    remaining,
  };
}

// ============================================
// HELPERS DE FECHAS
// ============================================

export interface MonthRange {
  start: Date;
  end: Date;
}

/**
 * Devuelve el rango de fechas [start, end] del mes dado.
 *
 * - start: primer día del mes a las 00:00:00.000 (hora local).
 * - end: último día del mes a las 23:59:59.999 (hora local).
 *
 * Consistente con `getDashboardTotals` de contributions.
 */
export function getMonthRange(year: number, month: number): MonthRange {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  return { start, end };
}