/**
 * Lógica de dominio para aportes.
 *
 * Reglas:
 * - NO accede a la base de datos.
 * - NO accede a la sesión.
 * - Todos los cálculos con Decimal (nunca number).
 * - Testeable sin mocks.
 */

import { Prisma } from "@prisma/client";

// ============================================
// CONSTANTES
// ============================================

export const MAX_NOTE_LENGTH = 280;
export const MAX_AMOUNT = new Prisma.Decimal("999999999999.99");
export const MIN_AMOUNT = new Prisma.Decimal("0.01");

/**
 * Tolerancia para fechas futuras: 1 día.
 * Un aporte con fecha "mañana" es técnicamente futuro en UTC,
 * pero puede ser válido para el usuario en su zona horaria.
 */
export const FUTURE_DATE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

// ============================================
// VALIDACIÓN DE FECHAS
// ============================================

export type DateValidationResult =
  | { valid: true }
  | { valid: false; reason: "FUTURE" | "BEFORE_COUPLE" };

/**
 * Verifica si una fecha de aporte es válida.
 *
 * Reglas:
 * - No puede ser futura (con tolerancia de 1 día).
 * - No puede ser anterior a la creación de la pareja.
 */
export function isValidContributionDate(
  contributionDate: Date,
  coupleCreatedAt: Date,
  now: Date = new Date()
): DateValidationResult {
  // Comparar por día (no por instante) usando UTC
  const contributionDay = Date.UTC(
    contributionDate.getUTCFullYear(),
    contributionDate.getUTCMonth(),
    contributionDate.getUTCDate()
  );

  const coupleDay = Date.UTC(
    coupleCreatedAt.getUTCFullYear(),
    coupleCreatedAt.getUTCMonth(),
    coupleCreatedAt.getUTCDate()
  );

  const nowDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  // No puede ser futuro (más de 1 día de diferencia para tolerar zonas horarias)
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (contributionDay > nowDay + oneDayMs) {
    return { valid: false, reason: "FUTURE" };
  }

  // No puede ser anterior al día de creación de la pareja
  if (contributionDay < coupleDay) {
    return { valid: false, reason: "BEFORE_COUPLE" };
  }

  return { valid: true };
}
// ============================================
// CÁLCULOS CON DECIMAL
// ============================================

export interface ContributionLike {
  amount: Prisma.Decimal;
  userId: string;
  contributionDate: Date;
}

/**
 * Suma todos los montos de una lista de aportes.
 *
 * Usa Decimal para evitar errores de precisión flotante.
 * Ejemplo: 0.10 + 0.20 === 0.30 (con number daría 0.30000000000000004).
 */
export function calculateTotal(
  contributions: ContributionLike[]
): Prisma.Decimal {
  return contributions.reduce(
    (acc, c) => acc.plus(c.amount),
    new Prisma.Decimal(0)
  );
}

/**
 * Agrupa y suma los montos por usuario.
 *
 * Retorna un Map de userId → total Decimal.
 */
export function calculateTotalByUser(
  contributions: ContributionLike[]
): Map<string, Prisma.Decimal> {
  const totals = new Map<string, Prisma.Decimal>();

  for (const c of contributions) {
    const current = totals.get(c.userId) ?? new Prisma.Decimal(0);
    totals.set(c.userId, current.plus(c.amount));
  }

  return totals;
}

/**
 * Suma los montos de aportes dentro de un mes/año específico.
 *
 * Mes es 1-indexado (1 = enero, 12 = diciembre).
 */
export function calculateMonthlyTotal(
  contributions: ContributionLike[],
  year: number,
  month: number
): Prisma.Decimal {
  const filtered = contributions.filter((c) => {
    const d = c.contributionDate;
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  return calculateTotal(filtered);
}

/**
 * Promedio mensual de aportes en un rango dado.
 *
 * Si no hay aportes, retorna 0.
 * Si el rango es 0 meses, retorna 0.
 */
export function calculateMonthlyAverage(
  contributions: ContributionLike[],
  monthsBack: number
): Prisma.Decimal {
  if (monthsBack <= 0) {
    return new Prisma.Decimal(0);
  }

  const total = calculateTotal(contributions);
  return total.dividedBy(monthsBack).toDecimalPlaces(2);
}

// ============================================
// FORMATO DE MONTO (solo para UI)
// ============================================

/**
 * Formatea un Decimal como moneda hondureña.
 *
 * IMPORTANTE: solo para presentación. Nunca usar el resultado
 * para volver a hacer cálculos.
 */
export function formatCurrency(amount: Prisma.Decimal): string {
  const value = Number(amount.toString());
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}