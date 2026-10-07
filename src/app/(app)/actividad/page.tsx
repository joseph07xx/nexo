import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";
import { getWithdrawalSources, listFinancialMovements } from "@/features/contributions/data";
import { ContributionList } from "@/features/contributions/components/contribution-list";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { serializeContribution, serializeWithdrawal } from "@/features/contributions/types";
import { WithdrawalButton } from "@/features/contributions/components/withdrawal-button";
import { getActiveGoalsForSelect } from "@/features/goals/data";
import { getRecentNotifications, countUnreadNotifications } from "@/features/notifications/data";
import { NotificationFeed, type NotificationFeedItem } from "@/features/notifications/components/notification-feed";
import { Filter, RotateCcw } from "lucide-react";

interface ActividadPageProps {
  searchParams: Promise<{ page?: string; from?: string; to?: string; focus?: string; kind?: string }>;
}

function parseDateFilter(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const dateOnly = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(dateOnly.getTime()) || dateOnly.toISOString().slice(0, 10) !== value) {
    return undefined;
  }

  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  return new Date(`${value}T${time}-06:00`);
}

export default async function ActividadPage({ searchParams }: ActividadPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasCouple = !!session.user.coupleId;
  const coupleId = session.user.coupleId;

  if (!hasCouple || !coupleId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historial de movimientos de su pareja
          </p>
        </header>

        <Card>
          <CardContent>
            <NoCoupleEmptyState
              icon={Activity}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para ver el historial compartido."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const fromDate = parseDateFilter(params.from);
  const toDate = parseDateFilter(params.to, true);
  const dateRangeInvalid = !!params.from && !!params.to && params.from > params.to;
  const focusId = params.focus;
  const focusKind = params.kind === "WITHDRAWAL" ? "WITHDRAWAL" : "CONTRIBUTION";

  const [result, goalOptions, withdrawalSources, recentNotifications, unreadCount] = await Promise.all([
    listFinancialMovements({
      coupleId,
      page,
      fromDate: dateRangeInvalid ? undefined : fromDate,
      toDate: dateRangeInvalid ? undefined : toDate,
      contributionId: focusId && focusKind === "CONTRIBUTION" ? focusId : undefined,
      withdrawalId: focusId && focusKind === "WITHDRAWAL" ? focusId : undefined,
    }),
    getActiveGoalsForSelect(coupleId),
    getWithdrawalSources(coupleId),
    getRecentNotifications(session.user.id),
    countUnreadNotifications(session.user.id),
  ]);

  const serializedItems = result.items.map((item) =>
    item.kind === "CONTRIBUTION"
      ? serializeContribution(item)
      : serializeWithdrawal(item)
  );
  const notifications: NotificationFeedItem[] = recentNotifications.flatMap((notification) => {
    const movement = notification.contribution ?? notification.withdrawal;
    if (!movement) return [];

    return [{
      id: notification.id,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
      actorName: notification.actor.name,
      movementKind: notification.withdrawal ? "WITHDRAWAL" : "CONTRIBUTION",
      movementId: movement.id,
      amount: movement.amount.toFixed(2),
      goalId: movement.goal?.id ?? null,
      goalName: movement.goal?.name ?? null,
    }];
  });

  return (
    <div className="space-y-7 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary"><Activity className="size-4" /> NEXO · MOVIMIENTOS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Actividad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aportes, retiros y avisos del ahorro compartido.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <WithdrawalButton sources={withdrawalSources} />
          <CreateContributionButton size="default" label="Registrar aporte" goalOptions={goalOptions} />
        </div>
      </header>

      <NotificationFeed notifications={notifications} unreadCount={unreadCount} />

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <form action="/actividad" method="get" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-muted-foreground" /> Filtrar movimientos</p>
            <p className="mt-1 text-xs text-muted-foreground">Busca aportes por fecha. El rango usa la zona horaria GMT-6.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Desde
              <input name="from" type="date" defaultValue={params.from ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Hasta
              <input name="to" type="date" defaultValue={params.to ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Aplicar</button>
            {(params.from || params.to || focusId) && (
              <Link href="/actividad" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <RotateCcw className="size-3.5" /> Limpiar
              </Link>
            )}
          </div>
        </form>
        {dateRangeInvalid && <p className="mt-3 text-xs font-medium text-destructive">La fecha inicial debe ser anterior o igual a la fecha final.</p>}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold">Movimientos</h2>
            <p className="mt-1 text-sm text-muted-foreground">{result.total} {result.total === 1 ? "movimiento registrado" : "movimientos registrados"}{focusId ? " · Movimiento seleccionado desde un aviso" : ""}</p>
          </div>
          {result.totalPages > 0 && <span className="text-xs text-muted-foreground">Página {result.page} de {result.totalPages}</span>}
        </div>

      <ContributionList
        initialItems={serializedItems}
        currentUserId={session.user.id}
        totalPages={result.totalPages}
        currentPage={result.page}
        total={result.total}
        pageSize={result.pageSize}
      />
      </section>
    </div>
  );
}