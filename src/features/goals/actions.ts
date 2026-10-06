"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createGoalSchema,
  updateGoalSchema,
} from "@/schemas/goal";
import {
  canArchiveGoal,
  canEditGoal,
  canUnarchiveGoal,
  isValidTargetDate,
} from "@/services/goals";
import {
  archiveGoal,
  createGoalWithLimitCheck,
  getGoalById,
  unarchiveGoal,
  updateGoal,
} from "./data";

// ============================================
// TIPOS DE RESULTADO
// ============================================

export type GoalActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

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

function revalidateGoalPaths() {
  revalidatePath("/metas");
  revalidatePath("/inicio");
}

// ============================================
// CREAR META
// ============================================

export async function createGoalAction(
  prevState: GoalActionResult | null,
  formData: FormData
): Promise<GoalActionResult> {
  const auth = await getAuthenticatedCouple();
  if (!auth) {
    return { success: false, error: "No autenticado o sin pareja" };
  }

  const parsed = createGoalSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description, targetAmount, targetDate } = parsed.data;

  const dateCheck = isValidTargetDate(targetDate);
  if (!dateCheck.valid) {
    return {
      success: false,
      error: "Fecha objetivo inválida",
      fieldErrors: {
        targetDate: ["La fecha objetivo debe ser futura"],
      },
    };
  }

  try {
    const goal = await createGoalWithLimitCheck({
      coupleId: auth.coupleId,
      name,
      description,
      targetAmount,
      targetDate,
    });

    revalidateGoalPaths();

    return { success: true, data: { id: goal.id } };
  } catch (error) {
    if (error instanceof Error && error.message === "GOAL_LIMIT_REACHED") {
      return {
        success: false,
        error: "Ya tienen 10 metas activas. Archiven o completen alguna antes de crear otra.",
      };
    }
    console.error("Error al crear meta:", error);
    return { success: false, error: "No se pudo crear la meta" };
  }
}

// ============================================
// ACTUALIZAR META
// ============================================

export async function updateGoalAction(
  id: string,
  prevState: GoalActionResult | null,
  formData: FormData
): Promise<GoalActionResult> {
  const auth = await getAuthenticatedCouple();
  if (!auth) {
    return { success: false, error: "No autenticado o sin pareja" };
  }

  const existing = await getGoalById(id);
  if (!existing || existing.coupleId !== auth.coupleId) {
    return { success: false, error: "Meta no encontrada" };
  }

  if (!canEditGoal(existing.status)) {
    return {
      success: false,
      error: "Solo se pueden editar metas activas",
    };
  }

  const parsed = updateGoalSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description, targetAmount, targetDate } = parsed.data;

  const dateCheck = isValidTargetDate(targetDate);
  if (!dateCheck.valid) {
    return {
      success: false,
      error: "Fecha objetivo inválida",
      fieldErrors: {
        targetDate: ["La fecha objetivo debe ser futura"],
      },
    };
  }

  try {
    await updateGoal({
      id,
      name,
      description,
      targetAmount,
      targetDate,
    });

    revalidateGoalPaths();
    revalidatePath(`/metas/${id}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error al actualizar meta:", error);
    return { success: false, error: "No se pudo actualizar la meta" };
  }
}

// ============================================
// ARCHIVAR META
// ============================================

export async function archiveGoalAction(
  id: string
): Promise<GoalActionResult> {
  const auth = await getAuthenticatedCouple();
  if (!auth) {
    return { success: false, error: "No autenticado o sin pareja" };
  }

  const existing = await getGoalById(id);
  if (!existing || existing.coupleId !== auth.coupleId) {
    return { success: false, error: "Meta no encontrada" };
  }

  if (!canArchiveGoal(existing.status)) {
    return {
      success: false,
      error: "Esta meta no puede archivarse en su estado actual",
    };
  }

  try {
    await archiveGoal(id);

    revalidateGoalPaths();
    revalidatePath(`/metas/${id}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error al archivar meta:", error);
    return { success: false, error: "No se pudo archivar la meta" };
  }
}

// ============================================
// RESTAURAR META ARCHIVADA
// ============================================

export async function unarchiveGoalAction(
  id: string
): Promise<GoalActionResult> {
  const auth = await getAuthenticatedCouple();
  if (!auth) {
    return { success: false, error: "No autenticado o sin pareja" };
  }

  const existing = await getGoalById(id);
  if (!existing || existing.coupleId !== auth.coupleId) {
    return { success: false, error: "Meta no encontrada" };
  }

  if (!canUnarchiveGoal(existing.status)) {
    return {
      success: false,
      error: "Solo se pueden restaurar metas archivadas",
    };
  }

  try {
    await unarchiveGoal(id);

    revalidateGoalPaths();
    revalidatePath(`/metas/${id}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error al restaurar meta:", error);
    return { success: false, error: "No se pudo restaurar la meta" };
  }
}