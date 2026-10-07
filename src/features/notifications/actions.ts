"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const };

  await prisma.inAppNotification.updateMany({
    where: {
      id: notificationId,
      recipientId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/actividad");
  return { success: true as const };
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const };

  await prisma.inAppNotification.updateMany({
    where: { recipientId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/actividad");
  return { success: true as const };
}