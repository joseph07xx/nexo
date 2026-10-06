import type { Prisma } from "@prisma/client";

/**
 * Versión serializable de un aporte para pasar de Server a Client Components.
 * El monto se pasa como string para preservar precisión decimal.
 */
export interface SerializableContribution {
  id: string;
  amount: string;
  note: string | null;
  contributionDate: string; // ISO string
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

/**
 * Convierte un aporte de Prisma en su versión serializable.
 * El Decimal se convierte a string con toFixed(2) para garantizar 2 decimales.
 */
export function serializeContribution(
  c: {
    id: string;
    amount: Prisma.Decimal;
    note: string | null;
    contributionDate: Date;
    userId: string;
    user: { id: string; name: string };
  }
): SerializableContribution {
  return {
    id: c.id,
    amount: c.amount.toFixed(2),
    note: c.note,
    contributionDate: c.contributionDate.toISOString(),
    userId: c.userId,
    user: {
      id: c.user.id,
      name: c.user.name,
    },
  };
}