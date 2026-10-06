"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, updateSession } from "@/auth";
import { joinCoupleSchema } from "@/schemas/couple";
import {
  canCreateCouple,
  canJoinCouple,
  isInvitationValid,
} from "@/services/couple";
import {
  createCoupleWithOwner,
  getCoupleMemberByUserId,
  getInvitationByCode,
  joinCoupleTransactional,
  regenerateInvitation,
} from "./data";

// ============================================
// TIPOS DE RESULTADO
// ============================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================
// REFRESH DE SESIÓN
// ============================================

async function refreshSession(coupleId: string | null): Promise<void> {
  await updateSession({ coupleId });
}

// ============================================
// CREAR PAREJA
// ============================================

export async function createCouple(): Promise<ActionResult<{ code: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado" };
  }

  const userId = session.user.id;

  const existing = await getCoupleMemberByUserId(userId);
  const check = canCreateCouple(existing?.coupleId ?? null);

  if (!check.allowed) {
    return { success: false, error: "Ya perteneces a una pareja" };
  }

  try {
    const { coupleId, invitationCode } = await createCoupleWithOwner(userId);

    await refreshSession(coupleId);

    revalidatePath("/perfil");
    revalidatePath("/inicio");

    return { success: true, data: { code: invitationCode } };
  } catch (error) {
    console.error("Error al crear pareja:", error);
    return {
      success: false,
      error: "No se pudo crear la pareja. Intenta de nuevo.",
    };
  }
}

// ============================================
// UNIRSE A PAREJA
// ============================================

export async function joinCouple(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado" };
  }

  const userId = session.user.id;

  const parsed = joinCoupleSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Código inválido. Formato esperado: NEXO-XXXXXX",
    };
  }

  const { code } = parsed.data;

  const invitation = await getInvitationByCode(code);
  if (!invitation) {
    return { success: false, error: "Código inválido o expirado" };
  }

  const invitationCheck = isInvitationValid({
    acceptedAt: invitation.acceptedAt,
    revokedAt: invitation.revokedAt,
    expiresAt: invitation.expiresAt,
  });

  if (!invitationCheck.valid) {
    const messages: Record<typeof invitationCheck.reason, string> = {
      ACCEPTED: "Esta invitación ya fue utilizada",
      REVOKED: "Esta invitación fue revocada",
      EXPIRED: "Esta invitación ha expirado",
    };
    return { success: false, error: messages[invitationCheck.reason] };
  }

  const userMembership = await getCoupleMemberByUserId(userId);
  const owner = invitation.couple.members.find((m) => m.role === "OWNER");

  if (!owner) {
    return { success: false, error: "Invitación inválida" };
  }

  const joinCheck = canJoinCouple({
    userCoupleId: userMembership?.coupleId ?? null,
    targetCoupleMemberCount: invitation.couple.members.length,
    userId,
    targetCoupleOwnerId: owner.userId,
  });

  if (!joinCheck.allowed) {
    const messages: Record<typeof joinCheck.reason, string> = {
      USER_ALREADY_IN_COUPLE: "Ya perteneces a una pareja",
      COUPLE_FULL: "Esta pareja ya tiene dos miembros",
      CANNOT_JOIN_OWN_COUPLE: "No puedes unirte a tu propia pareja",
    };
    return { success: false, error: messages[joinCheck.reason] };
  }

  try {
    const { coupleId } = await joinCoupleTransactional(
      userId,
      invitation.id,
      invitation.coupleId,
      owner.userId
    );

    await refreshSession(coupleId);

    revalidatePath("/perfil");
    revalidatePath("/inicio");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COUPLE_FULL") {
        return { success: false, error: "Esta pareja ya tiene dos miembros" };
      }
      if (error.message === "INVITATION_ALREADY_USED") {
        return { success: false, error: "Esta invitación ya fue utilizada" };
      }
    }
    console.error("Error al unirse a pareja:", error);
    return {
      success: false,
      error: "No se pudo unir a la pareja. Intenta de nuevo.",
    };
  }

  redirect("/inicio");
}

// ============================================
// REGENERAR INVITACIÓN
// ============================================

export async function regenerateInvitationAction(): Promise<
  ActionResult<{ code: string }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado" };
  }

  const userId = session.user.id;

  const membership = await getCoupleMemberByUserId(userId);
  if (!membership) {
    return { success: false, error: "No perteneces a una pareja" };
  }

  if (membership.role !== "OWNER") {
    return {
      success: false,
      error: "Solo el creador puede regenerar invitaciones",
    };
  }

  try {
    const { code } = await regenerateInvitation(membership.coupleId, userId);
    revalidatePath("/perfil");
    return { success: true, data: { code } };
  } catch (error) {
    console.error("Error al regenerar invitación:", error);
    return { success: false, error: "No se pudo regenerar la invitación" };
  }
}