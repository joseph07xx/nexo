/**
 * Lógica de dominio para metas de ahorro.
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

export const MAX_ACTIVE_GOALS = 10;
export const MAX_GOAL_NAME_LENGTH = 120;
export const MAX_GOAL_DESCRIPTION_LENGTH = 500;
export const MAX_GOAL_AMOUNT = new Prisma.Decimal("999999999999.99");

// ============================================
// CÁLCULO DE PROGRESO
// ============================================

export interface GoalProgress {
  /** Monto actual (suma de aportes asociados). Puede superar targetAmount. */
  current: Prisma.Decimal;
  /** Monto objetivo. */
  target: Prisma.Decimal;
  /** Restante para alcanzar el objetivo. Nunca negativo. */
  remaining: Prisma.Decimal;
  /** Porcentaje real (puede ser >100). No se limita aquí. */
  percentage: Prisma.Decimal;
  /** True si current >= target. */
  isComplete: boolean;
}

/**
 * Calcula el progreso de una meta.
 *
 * No limita el porcentaje a 100. El consumidor decide cómo mostrarlo.
 * `remaining` nunca es negativo.
 */
export function calculateGoalProgress(
  current: Prisma.Decimal,
  target: Prisma.Decimal
): GoalProgress {
  if (target.lessThanOrEqualTo(0)) {
    throw new Error("El monto objetivo debe ser mayor que cero");
  }

  const isComplete = current.greaterThanOrEqualTo(target);

  const remaining = isComplete
    ? new Prisma.Decimal(0)
    : target.minus(current);

  const percentage = current.dividedBy(target).times(100).toDecimalPlaces(2);

  return {
    current,
    target,
    remaining,
    percentage,
    isComplete,
  };
}

// ============================================
// VALIDACIÓN DE FECHA OBJETIVO
// ============================================

export type TargetDateValidation =
  | { valid: true }
  | { valid: false; reason: "PAST_DATE" };

/**
 * Verifica que una fecha objetivo sea futura respecto a `now`.
 *
 * Comparación por día UTC para evitar falsos negativos por zona horaria.
 * Si `targetDate` es null, siempre es válida.
 */
export function isValidTargetDate(
  targetDate: Date | null,
  now: Date = new Date()
): TargetDateValidation {
  if (targetDate === null) {
    return { valid: true };
  }

  const targetDay = Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate()
  );

  const todayDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  if (targetDay < todayDay) {
    return { valid: false, reason: "PAST_DATE" };
  }

  return { valid: true };
}

// ============================================
// REGLAS DE ESTADO
// ============================================

/**
 * Una meta puede editarse solo si está ACTIVE.
 */
export function canEditGoal(status: string): boolean {
  return status === "ACTIVE";
}

/**
 * Una meta puede archivarse solo si no está ya archivada.
 */
export function canArchiveGoal(status: string): boolean {
  return status === "ACTIVE" || status === "COMPLETED";
}

/**
 * Una meta puede restaurarse solo si está ARCHIVED.
 */
export function canUnarchiveGoal(status: string): boolean {
  return status === "ARCHIVED";
}

/**
 * Solo metas ACTIVE pueden recibir nuevos aportes.
 */
export function canAcceptContributions(status: string): boolean {
  return status === "ACTIVE";
}

// ============================================
// LÍMITE DE METAS ACTIVAS
// ============================================

export type ActiveGoalLimitCheck =
  | { allowed: true }
  | { allowed: false; reason: "LIMIT_REACHED"; limit: number };

export function canCreateActiveGoal(activeCount: number): ActiveGoalLimitCheck {
  if (activeCount >= MAX_ACTIVE_GOALS) {
    return { allowed: false, reason: "LIMIT_REACHED", limit: MAX_ACTIVE_GOALS };
  }
  return { allowed: true };
}