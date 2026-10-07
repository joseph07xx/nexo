import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { reconcileGoalStatus } from "@/features/goals/data";

// ============================================
// CONSULTAS
// ============================================

const CONTRIBUTION_PAGE_SIZE = 20;

export interface ListContributionsOptions {
  coupleId: string;
  userId?: string;
  goalId?: string;
  contributionId?: string;
  withdrawalId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
}

export async function listContributions({
  coupleId,
  userId,
  goalId,
  contributionId,
  fromDate,
  toDate,
  page = 1,
}: ListContributionsOptions) {
  const where: Prisma.SavingsContributionWhereInput = { coupleId };

  if (userId) {
    where.userId = userId;
  }

  if (goalId) {
    where.goalId = goalId;
  }

  if (contributionId) {
    where.id = contributionId;
  }

  if (fromDate || toDate) {
    where.contributionDate = {};

    if (fromDate) {
      where.contributionDate.gte = fromDate;
    }

    if (toDate) {
      where.contributionDate.lte = toDate;
    }
  }

  const skip = (page - 1) * CONTRIBUTION_PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.savingsContribution.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        goal: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: [
        { contributionDate: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: CONTRIBUTION_PAGE_SIZE,
    }),

    prisma.savingsContribution.count({
      where,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: CONTRIBUTION_PAGE_SIZE,
    totalPages: Math.ceil(total / CONTRIBUTION_PAGE_SIZE),
  };
}

export async function listFinancialMovements({
  coupleId,
  goalId,
  contributionId,
  withdrawalId,
  fromDate,
  toDate,
  page = 1,
}: ListContributionsOptions) {
  const contributionWhere: Prisma.SavingsContributionWhereInput = { coupleId };
  const withdrawalWhere: Prisma.SavingsWithdrawalWhereInput = { coupleId };
  const skip = (page - 1) * CONTRIBUTION_PAGE_SIZE;
  const take = skip + CONTRIBUTION_PAGE_SIZE;

  if (goalId !== undefined) {
    contributionWhere.goalId = goalId;
    withdrawalWhere.goalId = goalId;
  }

  if (contributionId) contributionWhere.id = contributionId;
  if (withdrawalId) withdrawalWhere.id = withdrawalId;

  if (fromDate || toDate) {
    contributionWhere.contributionDate = {};
    withdrawalWhere.withdrawalDate = {};
    if (fromDate) {
      contributionWhere.contributionDate.gte = fromDate;
      withdrawalWhere.withdrawalDate.gte = fromDate;
    }
    if (toDate) {
      contributionWhere.contributionDate.lte = toDate;
      withdrawalWhere.withdrawalDate.lte = toDate;
    }
  }

  const [contributions, withdrawals, contributionCount, withdrawalCount] = await Promise.all([
    withdrawalId
      ? Promise.resolve([])
      : prisma.savingsContribution.findMany({
      where: contributionWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        goal: { select: { id: true, name: true, status: true } },
      },
      orderBy: [{ contributionDate: "desc" }, { createdAt: "desc" }],
      take,
    }),
      contributionId
      ? Promise.resolve([])
      : prisma.savingsWithdrawal.findMany({
          where: withdrawalWhere,
          include: {
            user: { select: { id: true, name: true, email: true } },
            goal: { select: { id: true, name: true, status: true } },
          },
          orderBy: [{ withdrawalDate: "desc" }, { createdAt: "desc" }],
          take,
        }),
    contributionId
      ? prisma.savingsContribution.count({ where: contributionWhere })
      : withdrawalId
        ? Promise.resolve(0)
      : prisma.savingsContribution.count({ where: contributionWhere }),
    withdrawalId
      ? prisma.savingsWithdrawal.count({ where: withdrawalWhere })
      : contributionId
        ? Promise.resolve(0)
      : prisma.savingsWithdrawal.count({ where: withdrawalWhere }),
  ]);

  const movements = [
    ...contributions.map((contribution) => ({
      ...contribution,
      kind: "CONTRIBUTION" as const,
      movementAt: contribution.contributionDate,
    })),
    ...withdrawals.map((withdrawal) => ({
      ...withdrawal,
      kind: "WITHDRAWAL" as const,
      movementAt: withdrawal.withdrawalDate,
    })),
  ].sort((first, second) => {
    const dateDifference = second.movementAt.getTime() - first.movementAt.getTime();
    return dateDifference || second.createdAt.getTime() - first.createdAt.getTime();
  });

  const total = contributionCount + withdrawalCount;
  const items = movements.slice(skip, skip + CONTRIBUTION_PAGE_SIZE);

  return {
    items,
    total,
    page,
    pageSize: CONTRIBUTION_PAGE_SIZE,
    totalPages: Math.ceil(total / CONTRIBUTION_PAGE_SIZE),
  };
}

export async function countContributionsByCouple(coupleId: string) {
  return prisma.savingsContribution.count({
    where: { coupleId },
  });
}

export async function getContributionById(id: string) {
  return prisma.savingsContribution.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      goal: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });
}

export async function getAllContributionsByCouple(coupleId: string) {
  return prisma.savingsContribution.findMany({
    where: { coupleId },
    select: {
      id: true,
      userId: true,
      amount: true,
      contributionDate: true,
    },
    orderBy: {
      contributionDate: "desc",
    },
  });
}

export async function getRecentContributions(
  coupleId: string,
  limit = 5
) {
  return prisma.savingsContribution.findMany({
    where: { coupleId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      goal: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: [
      { contributionDate: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });
}

export async function getWithdrawalSources(coupleId: string) {
  const [goals, contributionTotals, withdrawalTotals] = await Promise.all([
    prisma.savingsGoal.findMany({
      where: { coupleId },
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savingsContribution.groupBy({
      by: ["goalId"],
      where: { coupleId },
      _sum: { amount: true },
    }),
    prisma.savingsWithdrawal.groupBy({
      by: ["goalId"],
      where: { coupleId },
      _sum: { amount: true },
    }),
  ]);

  const contributionsByGoal = new Map(
    contributionTotals.map((item) => [item.goalId, item._sum.amount ?? new Prisma.Decimal(0)])
  );
  const withdrawalsByGoal = new Map(
    withdrawalTotals.map((item) => [item.goalId, item._sum.amount ?? new Prisma.Decimal(0)])
  );
  const sources = [
    {
      goalId: null,
      name: "Aportes sin meta",
      balance: (contributionsByGoal.get(null) ?? new Prisma.Decimal(0))
        .minus(withdrawalsByGoal.get(null) ?? new Prisma.Decimal(0)),
    },
    ...goals.map((goal) => ({
      goalId: goal.id,
      name: goal.name,
      balance: (contributionsByGoal.get(goal.id) ?? new Prisma.Decimal(0))
        .minus(withdrawalsByGoal.get(goal.id) ?? new Prisma.Decimal(0)),
    })),
  ];

  return sources
    .filter((source) => source.balance.greaterThan(0))
    .map((source) => ({
      goalId: source.goalId,
      name: source.name,
      available: source.balance.toFixed(2),
    }));
}

export async function getAvailableWithdrawalBalance(
  coupleId: string,
  goalId: string | null,
  db: Prisma.TransactionClient = prisma
) {
  const where = { coupleId, goalId };
  const [contributions, withdrawals] = await Promise.all([
    db.savingsContribution.aggregate({ where, _sum: { amount: true } }),
    db.savingsWithdrawal.aggregate({ where, _sum: { amount: true } }),
  ]);

  return (contributions._sum.amount ?? new Prisma.Decimal(0))
    .minus(withdrawals._sum.amount ?? new Prisma.Decimal(0));
}

export interface CreateWithdrawalData {
  coupleId: string;
  userId: string;
  goalId: string | null;
  amount: Prisma.Decimal;
  note?: string;
}

export async function createWithdrawalWithBalanceCheck(data: CreateWithdrawalData) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.coupleId}))`;

    const available = await getAvailableWithdrawalBalance(
      data.coupleId,
      data.goalId,
      tx
    );

    if (data.amount.greaterThan(available)) {
      throw new Error("INSUFFICIENT_WITHDRAWAL_BALANCE");
    }

    const withdrawal = await tx.savingsWithdrawal.create({
      data: {
        coupleId: data.coupleId,
        userId: data.userId,
        goalId: data.goalId,
        amount: data.amount,
        note: data.note,
      },
      include: {
        user: { select: { id: true, name: true } },
        goal: { select: { id: true, name: true, status: true } },
      },
    });

    const recipients = await tx.coupleMember.findMany({
      where: {
        coupleId: data.coupleId,
        userId: { not: data.userId },
      },
      select: { userId: true },
    });

    if (recipients.length > 0) {
      await tx.inAppNotification.createMany({
        data: recipients.map((recipient) => ({
          recipientId: recipient.userId,
          actorId: data.userId,
          withdrawalId: withdrawal.id,
          type: "WITHDRAWAL_CREATED",
        })),
      });
    }

    if (data.goalId) {
      await reconcileGoalStatus(tx, data.goalId);
    }

    return withdrawal;
  });
}

// ============================================
// MUTACIONES
// ============================================

export interface CreateContributionData {
  coupleId: string;
  userId: string;
  amount: Prisma.Decimal;
  contributionDate: Date;
  note?: string;
  goalId?: string | null;
}

export async function createContribution(
  data: CreateContributionData
) {
  return prisma.$transaction(async (tx) => {
    const contribution = await tx.savingsContribution.create({
      data: {
        coupleId: data.coupleId,
        userId: data.userId,
        amount: data.amount,
        contributionDate: data.contributionDate,
        note: data.note,
        goalId: data.goalId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        goal: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    const recipients = await tx.coupleMember.findMany({
      where: {
        coupleId: data.coupleId,
        userId: { not: data.userId },
      },
      select: { userId: true },
    });

    if (recipients.length > 0) {
      await tx.inAppNotification.createMany({
        data: recipients.map((recipient) => ({
          recipientId: recipient.userId,
          actorId: data.userId,
          contributionId: contribution.id,
          type: "CONTRIBUTION_CREATED",
        })),
      });
    }

    if (data.goalId) {
      await reconcileGoalStatus(tx, data.goalId);
    }

    return contribution;
  });
}

export async function deleteContribution(id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.savingsContribution.findUnique({
      where: {
        id,
      },
      select: {
        coupleId: true,
        goalId: true,
        amount: true,
      },
    });

    if (!existing) return null;

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${existing.coupleId}))`;

    const available = await getAvailableWithdrawalBalance(
      existing.coupleId,
      existing.goalId,
      tx
    );

    if (available.lessThan(existing.amount)) {
      throw new Error("CONTRIBUTION_HAS_WITHDRAWALS");
    }

    const deleted = await tx.savingsContribution.delete({
      where: {
        id,
      },
    });

    if (existing?.goalId) {
      await reconcileGoalStatus(tx, existing.goalId);
    }

    return deleted;
  });
}

// ============================================
// AGREGADOS PARA DASHBOARD
// ============================================

export interface DashboardTotals {
  totalAllTime: Prisma.Decimal;
  totalThisMonth: Prisma.Decimal;
  byUserThisMonth: Array<{
    userId: string;
    name: string;
    total: Prisma.Decimal;
  }>;
}

export async function getDashboardTotals(
  coupleId: string,
  now: Date = new Date()
): Promise<DashboardTotals> {
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const [
    allContributions,
    allWithdrawals,
    monthContributions,
    monthWithdrawals,
    members,
  ] = await Promise.all([
    prisma.savingsContribution.findMany({
      where: {
        coupleId,
      },
      select: {
        amount: true,
      },
    }),

    prisma.savingsWithdrawal.findMany({
      where: { coupleId },
      select: { amount: true },
    }),

    prisma.savingsContribution.findMany({
      where: {
        coupleId,
        contributionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
        userId: true,
      },
    }),

    prisma.savingsWithdrawal.findMany({
      where: {
        coupleId,
        withdrawalDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { amount: true, userId: true },
    }),

    prisma.coupleMember.findMany({
      where: {
        coupleId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const totalAllTime = allContributions.reduce(
    (acc, contribution) =>
      acc.plus(contribution.amount),
    new Prisma.Decimal(0)
  ).minus(
    allWithdrawals.reduce(
      (acc, withdrawal) => acc.plus(withdrawal.amount),
      new Prisma.Decimal(0)
    )
  );

  const totalThisMonth = monthContributions.reduce(
    (acc, contribution) =>
      acc.plus(contribution.amount),
    new Prisma.Decimal(0)
  ).minus(
    monthWithdrawals.reduce(
      (acc, withdrawal) => acc.plus(withdrawal.amount),
      new Prisma.Decimal(0)
    )
  );

  const byUserThisMonth = members.map((member) => {
    const contributionTotal = monthContributions
      .filter(
        (contribution) =>
          contribution.userId === member.userId
      )
      .reduce(
        (acc, contribution) =>
          acc.plus(contribution.amount),
        new Prisma.Decimal(0)
      );
    return {
      userId: member.userId,
      name: member.user.name,
      total: contributionTotal,
    };
  });

  return {
    totalAllTime,
    totalThisMonth,
    byUserThisMonth,
  };
}