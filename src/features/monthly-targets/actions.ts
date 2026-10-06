"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { upsertMonthlyTargetSchema } from "@/schemas/monthly-target";
import { isCurrentMonth, isValidYearMonth } from "@/services/monthly-target";
import { upsertMonthlyTarget } from "./data";

// ============================================
// TIPOS DE RESULTADO
// ============================================

export type MonthlyTargetActionResult =
  | { success: true; data: undefined }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

// ============================================
// HELPERS
// ============================================

async function getAuthenticatedCouple() {
  const session = await auth();
  if (!session?.user?.id || !session.user.coupleId) {
    return null;
  }
  return {
    userId: session.user.id,
    coupleId: session.user.coupleId,
  };
}

// ============================================
// CREAR O EDITAR OBJETIVO MENSUAL
// ============================================

/**
 * Crea o actualiza el objetivo mensual de la pareja para el mes actual.
 *
 * Reglas:
 * - Solo el mes actual.
 * - No crea para meses futuros.
 * - No modifica meses anteriores.
 * - No elimina.
 */
export async function upsertMonthlyTargetAction(
  prevState: MonthlyTargetActionResult | null,
  formData: FormData
): Promise<MonthlyTargetActionResult> {
  const auth = await getAuthenticatedCouple();
  if (!auth) {
    return { success: false, error: "No autenticado o sin pareja" };
  }

  const parsed = upsertMonthlyTargetSchema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
    targetAmount: formData.get("targetAmount"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { year, month, targetAmount } = parsed.data;

  const ymCheck = isValidYearMonth(year, month);
  if (!ymCheck.valid) {
    const message =
      ymCheck.reason === "INVALID_YEAR"
        ? "Año inválido"
        : "Mes inválido (debe estar entre 1 y 12)";
    return {
      success: false,
      error: message,
    };
  }

  const currentCheck = isCurrentMonth(year, month);
  if (!currentCheck.valid) {
    return {
      success: false,
      error: "Solo se puede establecer el objetivo del mes actual",
    };
  }

  try {
    await upsertMonthlyTarget({
      coupleId: auth.coupleId,
      year,
      month,
      targetAmount,
    });

    revalidatePath("/inicio");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error al guardar objetivo mensual:", error);
    return {
      success: false,
      error: "No se pudo guardar el objetivo mensual",
    };
  }
}