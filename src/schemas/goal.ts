import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  MAX_GOAL_NAME_LENGTH,
  MAX_GOAL_DESCRIPTION_LENGTH,
  MAX_GOAL_AMOUNT,
} from "@/services/goals";

// ============================================
// MONTO OBJETIVO
// ============================================

/**
 * Mismo patrón que `amountSchema` de contribuciones:
 * - Acepta string o number.
 * - Solo dígitos con hasta 2 decimales.
 * - > 0 y <= MAX_GOAL_AMOUNT.
 * - Se transforma a Prisma.Decimal.
 */
const targetAmountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => val.toString().trim())
  .refine((val) => val.length > 0, "El monto objetivo es requerido")
  .refine(
    (val) => /^\d+(\.\d{1,2})?$/.test(val),
    "El monto objetivo debe tener máximo 2 decimales"
  )
  .transform((val) => new Prisma.Decimal(val))
  .refine(
    (dec) => dec.greaterThan(0),
    "El monto objetivo debe ser mayor que cero"
  )
  .refine(
    (dec) => dec.lessThanOrEqualTo(MAX_GOAL_AMOUNT),
    "El monto objetivo es demasiado grande"
  );

// ============================================
// FECHA OBJETIVO (opcional)
// ============================================

const targetDateSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined) return null;
    const trimmed = val.trim();
    if (trimmed === "") return null;
    return trimmed;
  })
  .refine(
    (val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val),
    "Fecha objetivo inválida"
  )
  .transform((val) => {
    if (val === null) return null;
    return new Date(`${val}T12:00:00.000Z`);
  })
  .refine(
    (date) => date === null || !Number.isNaN(date.getTime()),
    "Fecha objetivo inválida"
  );

// ============================================
// NOMBRE
// ============================================

const nameSchema = z
  .string()
  .trim()
  .min(1, "El nombre es requerido")
  .max(
    MAX_GOAL_NAME_LENGTH,
    `El nombre no puede superar los ${MAX_GOAL_NAME_LENGTH} caracteres`
  );

// ============================================
// DESCRIPCIÓN (opcional)
// ============================================

const descriptionSchema = z
  .string()
  .trim()
  .max(
    MAX_GOAL_DESCRIPTION_LENGTH,
    `La descripción no puede superar los ${MAX_GOAL_DESCRIPTION_LENGTH} caracteres`
  )
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" || val === undefined ? undefined : val));

// ============================================
// SCHEMAS FINALES
// ============================================

export const createGoalSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  targetAmount: targetAmountSchema,
  targetDate: targetDateSchema,
});

export const updateGoalSchema = createGoalSchema;

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;