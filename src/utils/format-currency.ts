import { Prisma } from "@prisma/client";

/**
 * Formatea un monto Decimal como moneda hondureña.
 *
 * Solo para presentación. Nunca usar el resultado
 * para volver a hacer cálculos.
 */
import { Prisma } from "@prisma/client";

export function formatCurrency(
  amount: Prisma.Decimal | string | number
): string {
  const value =
    typeof amount === "string"
      ? Number(amount)
      : amount instanceof Prisma.Decimal
        ? Number(amount.toString())
        : amount;

  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea una fecha en formato largo en español.
 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Formatea una fecha en formato corto (día + mes).
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    day: "numeric",
    month: "short",
  }).format(date);
}