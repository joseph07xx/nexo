"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, CircleDollarSign, ExternalLink } from "lucide-react";
import { formatCurrency, APP_TIMEZONE } from "@/utils/format-currency";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../actions";

export interface NotificationFeedItem {
  id: string;
  readAt: string | null;
  createdAt: string;
  actorName: string;
  movementKind: "CONTRIBUTION" | "WITHDRAWAL";
  movementId: string;
  amount: string;
  goalId: string | null;
  goalName: string | null;
}

export function NotificationFeed({
  notifications,
  unreadCount,
}: {
  notifications: NotificationFeedItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markRead(notificationId: string) {
    startTransition(async () => {
      await markNotificationReadAction(notificationId);
      router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="notification-heading">
      <div className="flex flex-col justify-between gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-5" />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-5 text-primary-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </span>
          <div>
            <h2 id="notification-heading" className="font-semibold">Avisos de tu pareja</h2>
            <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} sin leer` : "Todo al día"}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-2 self-start text-xs font-semibold text-primary transition-colors hover:text-primary/75 disabled:opacity-50 sm:self-auto"
          >
            <CheckCheck className="size-4" /> Marcar todo leído
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6">
          <CircleDollarSign className="size-5 shrink-0 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Cuando tu pareja registre un aporte, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notification) => {
            const isWithdrawal = notification.movementKind === "WITHDRAWAL";
            const href = `/actividad?focus=${encodeURIComponent(notification.movementId)}&kind=${notification.movementKind}#movement-${notification.movementId}`;
            const createdLabel = new Intl.DateTimeFormat("es-HN", {
              timeZone: APP_TIMEZONE,
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(notification.createdAt));

            return (
              <article key={notification.id} className={`flex items-start gap-3 px-4 py-4 transition-colors sm:px-5 ${notification.readAt ? "bg-card" : "bg-primary/[0.04]"}`}>
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${notification.readAt ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  <CircleDollarSign className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5">
                    <span className="font-semibold">{notification.actorName}</span>{" "}
                    {isWithdrawal ? "retiró " : "registró un aporte de "}
                    <span className={`font-semibold tabular-nums ${isWithdrawal ? "text-destructive" : ""}`}>
                      {isWithdrawal ? "− " : ""}{formatCurrency(notification.amount)}
                    </span>
                    {notification.goalName && <> para <Link href={`/metas/${notification.goalId}`} className="font-semibold text-primary hover:underline">{notification.goalName}</Link></>}.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-muted-foreground">{createdLabel}</span>
                    <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      Ver movimiento <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
                {!notification.readAt && (
                  <button
                    type="button"
                    onClick={() => markRead(notification.id)}
                    disabled={isPending}
                    aria-label="Marcar aviso como leído"
                    title="Marcar como leído"
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    <Check className="size-4" />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}