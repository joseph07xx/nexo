import { prisma } from "@/lib/prisma";

export function getRecentNotifications(recipientId: string, limit = 25) {
  return prisma.inAppNotification.findMany({
    where: { recipientId },
    select: {
      id: true,
      type: true,
      readAt: true,
      createdAt: true,
      actor: { select: { name: true } },
      contribution: {
        select: {
          id: true,
          amount: true,
          goal: { select: { id: true, name: true } },
        },
      },
      withdrawal: {
        select: {
          id: true,
          amount: true,
          goal: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function countUnreadNotifications(recipientId: string) {
  return prisma.inAppNotification.count({
    where: { recipientId, readAt: null },
  });
}