import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    if (fromDate) where.contributionDate.gte = fromDate;
    if (toDate) where.contributionDate.lte = toDate;
  }

  const skip = (page - 1) * CONTRIBUTION_PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.savingsContribution.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { contributionDate: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: CONTRIBUTION_PAGE_SIZE,
    }),
    prisma.savingsContribution.count({ where }),
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
  return prisma.savingsContribution.count({ where: { coupleId } });
}

export async function getContributionById(id: string) {
  return prisma.savingsContribution.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
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
    orderBy: { contributionDate: "desc" },
  });
}

export async function getRecentContributions(coupleId: string, limit = 5) {
  return prisma.savingsContribution.findMany({
    where: { coupleId },
    include: {
      user: {
        select: { id: true, name: true },
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

export async function createContribution(data: CreateContributionData) {
  return prisma.savingsContribution.create({
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
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export interface UpdateContributionData {
  id: string;
  amount: Prisma.Decimal;
  contributionDate: Date;
  note?: string;
  goalId?: string | null;
}

export async function updateContribution(data: UpdateContributionData) {
  return prisma.savingsContribution.update({
    where: { id: data.id },
    data: {
      amount: data.amount,
      contributionDate: data.contributionDate,
      note: data.note,
      goalId: data.goalId ?? null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function deleteContribution(id: string) {
  return prisma.savingsContribution.delete({
    where: { id },
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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [allContributions, monthContributions, members] = await Promise.all([
    prisma.savingsContribution.findMany({
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
    prisma.coupleMember.findMany({
      where: { coupleId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  const totalAllTime = allContributions.reduce(
    (acc, c) => acc.plus(c.amount),
    new Prisma.Decimal(0)
  );

  const totalThisMonth = monthContributions.reduce(
    (acc, c) => acc.plus(c.amount),
    new Prisma.Decimal(0)
  );

  const byUserThisMonth = members.map((member) => {
    const userTotal = monthContributions
      .filter((c) => c.userId === member.userId)
      .reduce((acc, c) => acc.plus(c.amount), new Prisma.Decimal(0));

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