import { z } from "zod";
import { Prisma } from "@prisma/client";
import { MAX_MONTHLY_TARGET } from "@/services/monthly-target";

// ============================================
// MONTO OBJETIVO
// ============================================

/**
 * Mismo patrón que en contribuciones y metas:
 * - Acepta string o number.
 * - Solo dígitos con hasta 2 decimales.
 * - > 0 y <= MAX_MONTHLY_TARGET.
 * - Se transforma a Prisma.Decimal.
 */
const targetAmountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => val.toString().trim())
  .refine((val) => val.length > 0, "El objetivo mensual es requerido")
  .refine(
    (val) => /^\d+(\.\d{1,2})?$/.test(val),
    "El objetivo mensual debe tener máximo 2 decimales"
  )
  .transform((val) => new Prisma.Decimal(val))
  .refine(
    (dec) => dec.greaterThan(0),
    "El objetivo mensual debe ser mayor que cero"
  )
  .refine(
    (dec) => dec.lessThanOrEqualTo(MAX_MONTHLY_TARGET),
    "El objetivo mensual es demasiado grande"
  );

// ============================================
// AÑO Y MES
// ============================================

const yearSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "number") return val;
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? NaN : parsed;
  })
  .refine((val) => Number.isInteger(val) && val > 0, "Año inválido");

const monthSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "number") return val;
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? NaN : parsed;
  })
  .refine(
    (val) => Number.isInteger(val) && val >= 1 && val <= 12,
    "Mes inválido (debe estar entre 1 y 12)"
  );

// ============================================
// SCHEMA FINAL
// ============================================

export const upsertMonthlyTargetSchema = z.object({
  year: yearSchema,
  month: monthSchema,
  targetAmount: targetAmountSchema,
});

export type UpsertMonthlyTargetInput = z.infer<typeof upsertMonthlyTargetSchema>;