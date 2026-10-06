/**
 * Lógica de dominio para parejas.
 *
 * Reglas:
 * - Este archivo NO accede a la base de datos.
 * - Este archivo NO accede a la sesión.
 * - Recibe datos, devuelve resultados.
 * - Es testeable sin mocks de infraestructura.
 */

// ============================================
// GENERACIÓN DE CÓDIGOS DE INVITACIÓN
// ============================================

/**
 * Alfabeto sin caracteres visualmente confusos.
 * Excluye: 0, O, 1, I, L
 */
const INVITATION_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const CODE_PREFIX = "NEXO-";
const CODE_LENGTH = 6;

/**
 * Genera un código de invitación criptográficamente seguro.
 *
 * Formato: NEXO-XXXXXX
 * Ejemplo: NEXO-7K2P9M
 *
 * No garantiza unicidad en base de datos.
 * La unicidad se garantiza con el @unique del schema + reintento en el servicio de datos.
 */
export function generateInvitationCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);

  let code = CODE_PREFIX;
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += INVITATION_ALPHABET[bytes[i] % INVITATION_ALPHABET.length];
  }
  return code;
}

// ============================================
// VALIDACIÓN DE INVITACIONES
// ============================================

export interface InvitationValidityInput {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}

export type InvitationInvalidReason =
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type InvitationValidity =
  | { valid: true }
  | { valid: false; reason: InvitationInvalidReason };

/**
 * Determina si una invitación es válida para ser utilizada.
 *
 * Invariante:
 *   válida := acceptedAt === null
 *             AND revokedAt === null
 *             AND expiresAt > now
 */
export function isInvitationValid(
  invitation: InvitationValidityInput,
  now: Date = new Date()
): InvitationValidity {
  if (invitation.acceptedAt !== null) {
    return { valid: false, reason: "ACCEPTED" };
  }
  if (invitation.revokedAt !== null) {
    return { valid: false, reason: "REVOKED" };
  }
  if (invitation.expiresAt <= now) {
    return { valid: false, reason: "EXPIRED" };
  }
  return { valid: true };
}

// ============================================
// REGLAS DE UNIÓN A PAREJA
// ============================================

export interface JoinCoupleInput {
  /** Si el usuario ya pertenece a una pareja, su coupleId. */
  userCoupleId: string | null;
  /** Número actual de miembros de la pareja destino. */
  targetCoupleMemberCount: number;
  /** ID del usuario que intenta unirse (para detectar auto-invitación). */
  userId: string;
  /** ID del owner de la pareja destino. */
  targetCoupleOwnerId: string;
}

export type JoinCoupleInvalidReason =
  | "USER_ALREADY_IN_COUPLE"
  | "COUPLE_FULL"
  | "CANNOT_JOIN_OWN_COUPLE";

export type JoinCoupleCheck =
  | { allowed: true }
  | { allowed: false; reason: JoinCoupleInvalidReason };

/**
 * Verifica si un usuario puede unirse a una pareja.
 *
 * NO verifica la validez de la invitación (eso lo hace isInvitationValid).
 * NO accede a la base de datos.
 */
export function canJoinCouple(input: JoinCoupleInput): JoinCoupleCheck {
  if (input.userCoupleId !== null) {
    return { allowed: false, reason: "USER_ALREADY_IN_COUPLE" };
  }

  if (input.targetCoupleMemberCount >= 2) {
    return { allowed: false, reason: "COUPLE_FULL" };
  }

  // El owner no puede unirse a su propia pareja con su propia invitación
  // (ya es miembro, pero por si acaso llega aquí por bug)
  if (input.userId === input.targetCoupleOwnerId) {
    return { allowed: false, reason: "CANNOT_JOIN_OWN_COUPLE" };
  }

  return { allowed: true };
}

// ============================================
// REGLAS DE CREACIÓN DE PAREJA
// ============================================

export type CreateCoupleCheck =
  | { allowed: true }
  | { allowed: false; reason: "USER_ALREADY_IN_COUPLE" };

/**
 * Verifica si un usuario puede crear una pareja.
 */
export function canCreateCouple(userCoupleId: string | null): CreateCoupleCheck {
  if (userCoupleId !== null) {
    return { allowed: false, reason: "USER_ALREADY_IN_COUPLE" };
  }
  return { allowed: true };
}

// ============================================
// UTILIDADES DE FECHAS
// ============================================

const INVITATION_TTL_DAYS = 7;

/**
 * Devuelve la fecha de expiración de una invitación nueva.
 * 7 días desde el momento de creación.
 */
export function getInvitationExpirationDate(now: Date = new Date()): Date {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);
  return expiresAt;
}