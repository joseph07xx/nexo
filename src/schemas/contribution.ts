import { z } from "zod";
import { Prisma } from "@prisma/client";
import { MAX_NOTE_LENGTH } from "@/services/contributions";

/**
 * Valida que el monto tenga máximo 2 decimales y sea positivo.
 *
 * Acepta: 100, 100.50, 100.5, 1.99
 * Rechaza: 0, -10, 1.999, 100.999
 */
const amountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => val.toString().trim())
  .refine((val) => val.length > 0, "La cantidad es requerida")
  .refine(
    (val) => /^\d+(\.\d{1,2})?$/.test(val),
    "La cantidad debe tener máximo 2 decimales"
  )
  .transform((val) => new Prisma.Decimal(val))
  .refine(
    (dec) => dec.greaterThan(0),
    "La cantidad debe ser mayor que cero"
  )
  .refine(
    (dec) => dec.lessThanOrEqualTo(new Prisma.Decimal("999999999999.99")),
    "La cantidad es demasiado grande"
  );

/**
 * Acepta una fecha en formato ISO (YYYY-MM-DD) desde un input date.
 * Convierte a Date en UTC.
 */
const dateSchema = z
  .string()
  .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), "Fecha inválida")
  .transform((val) => new Date(`${val}T12:00:00.000Z`))
  .refine(
    (date) => !Number.isNaN(date.getTime()),
    "Fecha inválida"
  );

const noteSchema = z
  .string()
  .trim()
  .max(MAX_NOTE_LENGTH, `La nota no puede superar los ${MAX_NOTE_LENGTH} caracteres`)
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? undefined : val));

export const createContributionSchema = z.object({
  amount: amountSchema,
  contributionDate: dateSchema,
  note: noteSchema,
  goalId: z.string().cuid().optional().nullable(),
});

export const createWithdrawalSchema = z.object({
  amount: amountSchema,
  note: noteSchema,
  goalId: z.string().cuid().optional().nullable(),
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;