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
  fromDate?: Date;
  toDate?: Date;
  page?: number;
}

export async function listContributions({
  coupleId,
  userId,
  fromDate,
  toDate,
  page = 1,
}: ListContributionsOptions) {
  const where: Prisma.SavingsContributionWhereInput = { coupleId };

  if (userId) {
    where.userId = userId;
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

    if (data.goalId) {
      await reconcileGoalStatus(tx, data.goalId);
    }

    return contribution;
  });
}

export interface UpdateContributionData {
  id: string;
  amount: Prisma.Decimal;
  contributionDate: Date;
  note?: string;
  goalId?: string | null;
}

export async function updateContribution(
  data: UpdateContributionData
) {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.savingsContribution.findUnique({
      where: {
        id: data.id,
      },
      select: {
        goalId: true,
      },
    });

    const updated = await tx.savingsContribution.update({
      where: {
        id: data.id,
      },
      data: {
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

    if (
      previous?.goalId &&
      previous.goalId !== data.goalId
    ) {
      await reconcileGoalStatus(tx, previous.goalId);
    }

    if (data.goalId) {
      await reconcileGoalStatus(tx, data.goalId);
    }

    return updated;
  });
}

export async function deleteContribution(id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.savingsContribution.findUnique({
      where: {
        id,
      },
      select: {
        goalId: true,
      },
    });

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
    monthContributions,
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
  );

  const totalThisMonth = monthContributions.reduce(
    (acc, contribution) =>
      acc.plus(contribution.amount),
    new Prisma.Decimal(0)
  );

  const byUserThisMonth = members.map((member) => {
    const userTotal = monthContributions
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
      total: userTotal,
    };
  });

  return {
    totalAllTime,
    totalThisMonth,
    byUserThisMonth,
  };
}