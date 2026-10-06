import type { Prisma } from "@prisma/client";

export interface SerializableContribution {
  id: string;
  amount: string;
  note: string | null;
  contributionDate: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  goal: {
    id: string;
    name: string;
    status: string;
  } | null;
}

export function serializeContribution(c: {
  id: string;
  amount: Prisma.Decimal;
  note: string | null;
  contributionDate: Date;
  userId: string;
  user: { id: string; name: string };
  goal: { id: string; name: string; status: string } | null;
}): SerializableContribution {
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
    goal: c.goal
      ? {
          id: c.goal.id,
          name: c.goal.name,
          status: c.goal.status,
        }
      : null,
  };
}