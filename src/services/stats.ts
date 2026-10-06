/**
 * Lógica de dominio para estadísticas.
 *
 * Reglas:
 * - NO accede a la base de datos.
 * - NO accede a la sesión.
 * - Todos los cálculos con Decimal.
 * - Testeable con datos simples.
 */

import { Prisma } from "@prisma/client";

// ============================================
// TIPOS
// ============================================

export interface ContributionLike {
  amount: Prisma.Decimal;
  userId: string;
  contributionDate: Date;
}

export interface MonthlyTargetLike {
  year: number;
  month: number;
  targetAmount: Prisma.Decimal;
}

export interface MonthKey {
  year: number;
  month: number;
}

export interface MonthBucket {
  key: string; // "YYYY-MM"
  year: number;
  month: number;
  total: Prisma.Decimal;
}

export interface UserBucket {
  userId: string;
  total: Prisma.Decimal;
}

// ============================================
// HELPERS DE MES
// ============================================

/**
 * Formatea un (year, month) como string "YYYY-MM".
 * Mes 1-indexado.
 */
export function formatMonthKey(year: number, month: number): string {
  const m = month.toString().padStart(2, "0");
  return `${year}-${m}`;
}

/**
 * Devuelve el mes de una fecha usando hora LOCAL.
 *
 * Consistente con `getMonthRange` de monthly-target y
 * con `getDashboardTotals` de contributions.
 */
export function getMonthKeyFromDate(date: Date): string {
  return formatMonthKey(date.getFullYear(), date.getMonth() + 1);
}

/**
 * Devuelve los últimos N meses calendario (incluyendo el mes actual),
 * ordenados de más antiguo a más reciente.
 *
 * Ejemplo con N=6 y hoy=octubre 2026:
 * [mayo, junio, julio, agosto, septiembre, octubre]
 */
export function getLastNMonths(
  n: number,
  now: Date = new Date()
): MonthKey[] {
  const result: MonthKey[] = [];
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1;

  for (let i = n - 1; i >= 0; i--) {
    let m = baseMonth - i;
    let y = baseYear;

    while (m <= 0) {
      m += 12;
      y -= 1;
    }

    result.push({ year: y, month: m });
  }

  return result;
}

// ============================================
// AGREGACIONES
// ============================================

/**
 * Agrupa aportes por mes (YYYY-MM) usando `contributionDate`.
 *
 * Retorna un Map de "YYYY-MM" → total Decimal.
 * Solo incluye meses con al menos un aporte.
 */
export function aggregateMonthly(
  contributions: ContributionLike[]
): Map<string, Prisma.Decimal> {
  const result = new Map<string, Prisma.Decimal>();

  for (const c of contributions) {
    const key = getMonthKeyFromDate(c.contributionDate);
    const current = result.get(key) ?? new Prisma.Decimal(0);
    result.set(key, current.plus(c.amount));
  }

  return result;
}

/**
 * Agrupa aportes por usuario. Histórico completo.
 */
export function aggregateByUser(
  contributions: ContributionLike[]
): Map<string, Prisma.Decimal> {
  const result = new Map<string, Prisma.Decimal>();

  for (const c of contributions) {
    const current = result.get(c.userId) ?? new Prisma.Decimal(0);
    result.set(c.userId, current.plus(c.amount));
  }

  return result;
}

/**
 * Suma total de todos los aportes.
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
 * Cuenta de aportes total.
 */
export function countContributions(
  contributions: ContributionLike[]
): number {
  return contributions.length;
}

/**
 * Cuenta de meses activos (meses con al menos un aporte).
 */
export function countActiveMonths(
  contributions: ContributionLike[]
): number {
  return aggregateMonthly(contributions).size;
}

// ============================================
// PROMEDIO MENSUAL
// ============================================

/**
 * Promedio mensual = total histórico / meses activos.
 *
 * Si no hay meses activos, retorna 0.
 */
export function calculateMonthlyAverage(
  contributions: ContributionLike[]
): Prisma.Decimal {
  const total = calculateTotal(contributions);
  const activeMonths = countActiveMonths(contributions);

  if (activeMonths === 0) {
    return new Prisma.Decimal(0);
  }

  return total.dividedBy(activeMonths).toDecimalPlaces(2);
}

// ============================================
// MEJOR / PEOR MES
// ============================================

export interface BestWorstResult {
  best: MonthBucket | null;
  worst: MonthBucket | null;
}

/**
 * Encuentra el mejor y peor mes histórico.
 *
 * - "Mejor" = mayor total.
 * - "Peor" = menor total entre meses con al menos un aporte.
 * - Si no hay aportes: ambos son null.
 * - Si solo hay 1 mes activo: ambos son ese mismo mes.
 */
export function findBestAndWorstMonths(
  contributions: ContributionLike[]
): BestWorstResult {
  const monthly = aggregateMonthly(contributions);

  if (monthly.size === 0) {
    return { best: null, worst: null };
  }

  const buckets: MonthBucket[] = Array.from(monthly.entries()).map(
    ([key, total]) => {
      const [yearStr, monthStr] = key.split("-");
      return {
        key,
        year: parseInt(yearStr, 10),
        month: parseInt(monthStr, 10),
        total,
      };
    }
  );

  let best = buckets[0];
  let worst = buckets[0];

  for (const b of buckets) {
    if (b.total.greaterThan(best.total)) {
      best = b;
    }
    if (b.total.lessThan(worst.total)) {
      worst = b;
    }
  }

  return { best, worst };
}

// ============================================
// PROGRESO ACUMULADO
// ============================================

export interface CumulativePoint {
  key: string; // "YYYY-MM"
  year: number;
  month: number;
  monthly: Prisma.Decimal;
  cumulative: Prisma.Decimal;
}

/**
 * Progreso acumulado histórico.
 *
 * Comienza en el primer mes con actividad y avanza cronológicamente
 * hasta el mes actual. Los meses intermedios sin aportes aparecen con
 * monthly = 0 pero el cumulative se mantiene.
 */
export function calculateCumulative(
  contributions: ContributionLike[],
  now: Date = new Date()
): CumulativePoint[] {
  if (contributions.length === 0) {
    return [];
  }

  const monthly = aggregateMonthly(contributions);

  // Ordenar los meses existentes
  const sortedKeys = Array.from(monthly.keys()).sort();

  // Primer mes con actividad
  const firstKey = sortedKeys[0];
  const [firstYearStr, firstMonthStr] = firstKey.split("-");
  let currentYear = parseInt(firstYearStr, 10);
  let currentMonth = parseInt(firstMonthStr, 10);

  const currentYearNow = now.getFullYear();
  const currentMonthNow = now.getMonth() + 1;

  const result: CumulativePoint[] = [];
  let cumulative = new Prisma.Decimal(0);

  // Iterar mes a mes desde el primer mes con actividad hasta el mes actual
  while (
    currentYear < currentYearNow ||
    (currentYear === currentYearNow && currentMonth <= currentMonthNow)
  ) {
    const key = formatMonthKey(currentYear, currentMonth);
    const monthTotal = monthly.get(key) ?? new Prisma.Decimal(0);
    cumulative = cumulative.plus(monthTotal);

    result.push({
      key,
      year: currentYear,
      month: currentMonth,
      monthly: monthTotal,
      cumulative,
    });

    // Avanzar un mes
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  return result;
}

// ============================================
// CUMPLIMIENTO DE OBJETIVOS MENSUALES
// ============================================

export interface GoalCompletionResult {
  completed: number;
  total: number;
  percentage: Prisma.Decimal;
}

/**
 * Calcula el cumplimiento de objetivos mensuales.
 *
 * Solo cuenta los meses que tienen un MonthlyTarget registrado.
 *
 * Un mes se considera cumplido si:
 *   total de aportes del mes >= target del mes
 *
 * Si el mes tiene target pero no tiene aportes, cuenta como NO cumplido.
 */
export function calculateGoalCompletion(
  contributions: ContributionLike[],
  targets: MonthlyTargetLike[]
): GoalCompletionResult {
  if (targets.length === 0) {
    return {
      completed: 0,
      total: 0,
      percentage: new Prisma.Decimal(0),
    };
  }

  const monthly = aggregateMonthly(contributions);

  let completed = 0;

  for (const target of targets) {
    const key = formatMonthKey(target.year, target.month);
    const saved = monthly.get(key) ?? new Prisma.Decimal(0);

    if (saved.greaterThanOrEqualTo(target.targetAmount)) {
      completed += 1;
    }
  }

  const total = targets.length;
  const percentage = new Prisma.Decimal(completed)
    .dividedBy(total)
    .times(100)
    .toDecimalPlaces(2);

  return { completed, total, percentage };
}

// ============================================
// DATOS PARA EL GRÁFICO MENSUAL
// ============================================

export interface MonthlyChartPoint {
  key: string;
  year: number;
  month: number;
  total: Prisma.Decimal;
  target: Prisma.Decimal | null;
}

/**
 * Construye los datos para el gráfico mensual de los últimos N meses.
 *
 * - Siempre devuelve N puntos, uno por cada mes calendario.
 * - Meses sin aportes aparecen con total = 0.
 * - target es null si no existe MonthlyTarget para ese mes.
 */
export function buildMonthlyChartData(
  contributions: ContributionLike[],
  targets: MonthlyTargetLike[],
  monthsBack: number,
  now: Date = new Date()
): MonthlyChartPoint[] {
  const months = getLastNMonths(monthsBack, now);
  const monthly = aggregateMonthly(contributions);

  const targetsByKey = new Map<string, Prisma.Decimal>();
  for (const t of targets) {
    targetsByKey.set(formatMonthKey(t.year, t.month), t.targetAmount);
  }

  return months.map((m) => {
    const key = formatMonthKey(m.year, m.month);
    return {
      key,
      year: m.year,
      month: m.month,
      total: monthly.get(key) ?? new Prisma.Decimal(0),
      target: targetsByKey.get(key) ?? null,
    };
  });
}