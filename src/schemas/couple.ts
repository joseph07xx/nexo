import { z } from "zod";

/**
 * Formato de código de invitación: NEXO-XXXXXX
 * 6 caracteres del alfabeto sin caracteres confusos.
 */
const INVITATION_CODE_REGEX = /^NEXO-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export const joinCoupleSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      INVITATION_CODE_REGEX,
      "El código debe tener el formato NEXO-XXXXXX"
    ),
});

export type JoinCoupleInput = z.infer<typeof joinCoupleSchema>;