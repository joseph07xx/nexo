
import { prisma } from "@/lib/prisma";
import { generateInvitationCode, getInvitationExpirationDate } from "@/services/couple";
import type { CoupleRole, Prisma } from "@prisma/client";



// ============================================
// CONSULTAS
// ============================================

export async function getCoupleMemberByUserId(userId: string) {
  return prisma.coupleMember.findUnique({
    where: { userId },
    include: { couple: true },
  });
}

export async function getCoupleWithMembers(coupleId: string) {
  return prisma.couple.findUnique({
    where: { id: coupleId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
}

export async function getActiveInvitationByCoupleId(coupleId: string) {
  return prisma.coupleInvitation.findFirst({
    where: {
      coupleId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvitationByCode(code: string) {
  return prisma.coupleInvitation.findUnique({
    where: { code },
    include: {
      couple: {
        include: {
          members: {
            select: { id: true, userId: true, role: true },
          },
        },
      },
    },
  });
}

// ============================================
// MUTACIONES
// ============================================

/**
 * Crea una pareja nueva con el usuario como OWNER,
 * y genera la primera invitación.
 *
 * Todo en una transacción.
 *
 * Retorna el código de invitación y el coupleId.
 */
export async function createCoupleWithOwner(userId: string): Promise<{
  coupleId: string;
  invitationCode: string;
}> {
  return prisma.$transaction(async (tx) => {
    // 1. Crear la pareja con memberCount = 1 (el owner)
    const couple = await tx.couple.create({
      data: { memberCount: 1 },
    });

    // 2. Crear la membresía del owner
    await tx.coupleMember.create({
      data: {
        coupleId: couple.id,
        userId,
        role: "OWNER" as CoupleRole,
      },
    });

    // 3. Generar código único con reintento
    const invitation = await createInvitationWithRetry(tx, couple.id, userId);

    return {
      coupleId: couple.id,
      invitationCode: invitation.code,
    };
  });
}

/**
 * Genera una invitación con reintento en caso de colisión de código.
 *
 * La colisión es extremadamente improbable (32^6 = ~1 mil millones de combinaciones),
 * pero el reintento es barato y garantiza robustez.
 *
 * NO usa advisory locks ni nada exótico. Simplemente reintenta hasta 3 veces.
 */
async function createInvitationWithRetry(
  tx: Prisma.TransactionClient,
  coupleId: string,
  createdById: string,
  maxAttempts = 3
) {
  const expiresAt = getInvitationExpirationDate();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInvitationCode();
    try {
      return await tx.coupleInvitation.create({
        data: {
          coupleId,
          code,
          createdById,
          expiresAt,
        },
      });
    } catch (error) {
      // P2002 = unique constraint violation (colisión de código)
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "P2002" &&
        attempt < maxAttempts - 1
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("No se pudo generar un código de invitación único");
}

/**
 * Une a un usuario a una pareja existente.
 *
 * Aplica concurrencia controlada con UPDATE ... WHERE memberCount < 2.
 *
 * Retorna el coupleId si tuvo éxito.
 * Lanza errores tipados si falla.
 */
export async function joinCoupleTransactional(
  userId: string,
  invitationId: string,
  coupleId: string,
  ownerId: string
): Promise<{ coupleId: string }> {
  return prisma.$transaction(async (tx) => {
    // 1. Incremento atómico con guarda de capacidad.
    //    Si la pareja ya tiene 2 miembros, esta operación afecta 0 filas.
    //    Postgres serializa esto con row-level lock.
    const updated = await tx.couple.updateMany({
      where: {
        id: coupleId,
        memberCount: { lt: 2 },
      },
      data: { memberCount: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new Error("COUPLE_FULL");
    }

    // 2. Crear la membresía.
    //    Si por algún motivo ya existe (race condition residual),
    //    el @@unique([coupleId, userId]) lo bloquea.
    await tx.coupleMember.create({
      data: {
        coupleId,
        userId,
        role: "MEMBER" as CoupleRole,
      },
    });

    // 3. Marcar la invitación como aceptada.
    //    La guarda acceptedAt: null previene doble uso.
    const invitationUpdated = await tx.coupleInvitation.updateMany({
      where: {
        id: invitationId,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { acceptedAt: new Date() },
    });

    if (invitationUpdated.count === 0) {
      throw new Error("INVITATION_ALREADY_USED");
    }

    return { coupleId };
  });
}

/**
 * Revoca todas las invitaciones activas de una pareja
 * y crea una nueva.
 */
export async function regenerateInvitation(
  coupleId: string,
  createdById: string
): Promise<{ code: string; expiresAt: Date }> {
  return prisma.$transaction(async (tx) => {
    // 1. Revocar invitaciones activas
    await tx.coupleInvitation.updateMany({
      where: {
        coupleId,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    // 2. Crear nueva con reintento
    const invitation = await createInvitationWithRetry(tx, coupleId, createdById);

    return {
      code: invitation.code,
      expiresAt: invitation.expiresAt,
    };
  });
}