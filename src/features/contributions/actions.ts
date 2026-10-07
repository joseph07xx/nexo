"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createContributionSchema,
  createWithdrawalSchema,
} from "@/schemas/contribution";
import { isValidContributionDate } from "@/services/contributions";
import {
  createContribution,
  createWithdrawalWithBalanceCheck,
  deleteContribution,
  getContributionById,
} from "./data";
import { serializeContribution } from "./types";

// ============================================
// TIPOS DE RESULTADO
// ============================================

export type ContributionActionResult<T = unknown> =
  | { success: true; data: T }
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

async function getCoupleCreatedAt(coupleId: string): Promise<Date | null> {
  const couple = await prisma.couple.findUnique({
    where: {
      id: coupleId,
    },
    select: {
      createdAt: true,
    },
  });

  return couple?.createdAt ?? null;
}

// ============================================
// CREAR APORTE
// ============================================

export async function createContributionAction(
  prevState: ContributionActionResult | null,
  formData: FormData
): Promise<ContributionActionResult> {
  const auth = await getAuthenticatedCouple();

  if (!auth) {
    return {
      success: false,
      error: "No autenticado o sin pareja",
    };
  }

  const parsed = createContributionSchema.safeParse({
    amount: formData.get("amount"),
    contributionDate: formData.get("contributionDate"),
    note: formData.get("note"),
    goalId: formData.get("goalId") || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { amount, contributionDate, note, goalId } = parsed.data;

  // ============================================
  // VALIDAR FECHA
  // ============================================

  const coupleCreatedAt = await getCoupleCreatedAt(auth.coupleId);

  if (!coupleCreatedAt) {
    return {
      success: false,
      error: "Pareja no encontrada",
    };
  }

  const dateCheck = isValidContributionDate(
    contributionDate,
    coupleCreatedAt
  );

  if (!dateCheck.valid) {
    const messages: Record<typeof dateCheck.reason, string> = {
      FUTURE: "La fecha no puede ser futura",
      BEFORE_COUPLE:
        "La fecha no puede ser anterior a la creación de la pareja",
    };

    return {
      success: false,
      error: "Fecha inválida",
      fieldErrors: {
        contributionDate: [messages[dateCheck.reason]],
      },
    };
  }

  // ============================================
  // VALIDAR META
  // ============================================

  if (goalId) {
    const goal = await prisma.savingsGoal.findUnique({
      where: {
        id: goalId,
      },
      select: {
        coupleId: true,
        status: true,
      },
    });

    if (!goal || goal.coupleId !== auth.coupleId) {
      return {
        success: false,
        error: "Meta inválida",
      };
    }

    if (goal.status !== "ACTIVE") {
      return {
        success: false,
        error: "Solo se pueden asociar aportes a metas activas",
      };
    }
  }

  // ============================================
  // CREAR APORTE
  // ============================================

  try {
    const contribution = await createContribution({
      coupleId: auth.coupleId,
      userId: auth.userId,
      amount,
      contributionDate,
      note,
      goalId: goalId ?? null,
    });

    revalidatePath("/inicio");
    revalidatePath("/actividad");

    return {
      success: true,
      data: serializeContribution(contribution),
    };
  } catch (error) {
    console.error("Error al crear aporte:", error);

    return {
      success: false,
      error: "No se pudo registrar el aporte",
    };
  }
}

export async function createWithdrawalAction(
  _prevState: ContributionActionResult | null,
  formData: FormData
): Promise<ContributionActionResult> {
  const auth = await getAuthenticatedCouple();

  if (!auth) {
    return { success: false, error: "No autenticado o sin pareja" };
  }

  const parsed = createWithdrawalSchema.safeParse({
    amount: formData.get("amount"),
    note: formData.get("note"),
    goalId: formData.get("goalId") || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { amount, note, goalId } = parsed.data;

  if (goalId) {
    const goal = await prisma.savingsGoal.findUnique({
      where: { id: goalId },
      select: { coupleId: true },
    });

    if (!goal || goal.coupleId !== auth.coupleId) {
      return { success: false, error: "La meta seleccionada no es válida" };
    }
  }

  try {
    await createWithdrawalWithBalanceCheck({
      coupleId: auth.coupleId,
      userId: auth.userId,
      goalId: goalId ?? null,
      amount,
      note,
    });

    revalidatePath("/inicio");
    revalidatePath("/actividad");
    revalidatePath("/estadisticas");
    revalidatePath("/metas");
    if (goalId) revalidatePath(`/metas/${goalId}`);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_WITHDRAWAL_BALANCE") {
      return {
        success: false,
        error: "El retiro supera el saldo disponible de ese origen. Actualiza el saldo e inténtalo de nuevo.",
      };
    }

    console.error("Error al registrar retiro:", error);
    return { success: false, error: "No se pudo registrar el retiro" };
  }
}

// ============================================
// ELIMINAR APORTE
// ============================================

// ============================================
// ELIMINAR APORTE
// ============================================

export async function deleteContributionAction(
  id: string
): Promise<ContributionActionResult> {
  const auth = await getAuthenticatedCouple();

  if (!auth) {
    return {
      success: false,
      error: "No autenticado o sin pareja",
    };
  }

  // ============================================
  // BUSCAR APORTE EXISTENTE
  // ============================================

  const existing = await getContributionById(id);

  if (!existing) {
    return {
      success: false,
      error: "Aporte no encontrado",
    };
  }

  // ============================================
  // VALIDAR PERTENENCIA A LA PAREJA
  // ============================================

  if (existing.coupleId !== auth.coupleId) {
    return {
      success: false,
      error: "Aporte no encontrado",
    };
  }

  // ============================================
  // VALIDAR PROPIETARIO
  // ============================================

  if (existing.userId !== auth.userId) {
    return {
      success: false,
      error: "Solo puedes eliminar tus propios aportes",
    };
  }

  // ============================================
  // ELIMINAR APORTE
  // ============================================

  try {
    await deleteContribution(id);

    revalidatePath("/inicio");
    revalidatePath("/actividad");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "CONTRIBUTION_HAS_WITHDRAWALS") {
      return {
        success: false,
        error: "No se puede eliminar: ya se retiró parte del saldo de este origen.",
      };
    }

    console.error("Error al eliminar aporte:", error);

    return {
      success: false,
      error: "No se pudo eliminar el aporte",
    };
  }
}