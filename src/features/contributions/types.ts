import type { Prisma } from "@prisma/client";

export interface SerializableContribution {
  kind: "CONTRIBUTION";
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
    kind: "CONTRIBUTION",
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

export interface SerializableWithdrawal {
  kind: "WITHDRAWAL";
  id: string;
  amount: string;
  note: string | null;
  withdrawalDate: string;
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

export type SerializableFinancialMovement =
  | SerializableContribution
  | SerializableWithdrawal;

export interface WithdrawalSource {
  goalId: string | null;
  name: string;
  available: string;
}

export function serializeWithdrawal(withdrawal: {
  id: string;
  amount: Prisma.Decimal;
  note: string | null;
  withdrawalDate: Date;
  userId: string;
  user: { id: string; name: string };
  goal: { id: string; name: string; status: string } | null;
}): SerializableWithdrawal {
  return {
    kind: "WITHDRAWAL",
    id: withdrawal.id,
    amount: withdrawal.amount.toFixed(2),
    note: withdrawal.note,
    withdrawalDate: withdrawal.withdrawalDate.toISOString(),
    userId: withdrawal.userId,
    user: withdrawal.user,
    goal: withdrawal.goal,
  };
}