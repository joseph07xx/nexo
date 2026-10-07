import { Prisma } from "@prisma/client";

export const APP_TIMEZONE = "Etc/GMT+6";

/**
 * Formatea un monto Decimal como moneda hondureña.
 *
 * Solo para presentación. Nunca usar el resultado
 * para volver a hacer cálculos.
 */

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

export function getIsoDateInAppTimezone(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return `${map.year}-${map.month}-${map.day}`;
}

export function getGreetingForTime(date: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(date)
  );

  if (hour >= 5 && hour < 12) {
    return "Buenos días";
  }

  if (hour >= 12 && hour < 18) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

/**
 * Formatea una fecha en formato largo en español.
 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: APP_TIMEZONE,
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
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}