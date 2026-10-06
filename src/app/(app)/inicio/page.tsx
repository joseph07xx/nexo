import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NexoLogo } from "@/components/brand/nexo-logo";
import { ArrowRight, Info } from "lucide-react";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { ContributionSummary } from "@/features/contributions/components/contribution-summary";
import {
  getDashboardTotals,
  getRecentContributions,
} from "@/features/contributions/data";
import { mockHomeData } from "@/features/home/data/mock";
import { formatCurrency, formatDateShort } from "@/utils/format-currency";

export default async function InicioPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasCouple = !!session.user.coupleId;
  const userName = session.user.name ?? "Usuario";
  const firstName = userName.split(" ")[0];

  if (!hasCouple || !session.user.coupleId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">
            Buenos días, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aún no tienes pareja en NEXO
          </p>
        </header>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">Aún no tienes pareja en NEXO.</p>
            <Link
              href="/perfil"
              className="text-sm font-medium text-primary hover:underline"
            >
              Creen una para empezar a ahorrar juntos →
            </Link>
          </div>
        </div>

        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="pt-6">
            <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
              Nuestro ahorro
            </p>
            <p className="text-4xl font-bold tabular-nums mt-1">L 0.00</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coupleId = session.user.coupleId;

  const [totals, recent] = await Promise.all([
    getDashboardTotals(coupleId),
    getRecentContributions(coupleId, 5),
  ]);

  const goal = mockHomeData.mainGoal;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <NexoLogo size={32} className="lg:hidden shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              Buenos días, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Este mes llevan {formatCurrency(totals.totalThisMonth)}
            </p>
          </div>
        </div>
      </header>

      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="pt-6">
          <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
            Nuestro ahorro
          </p>
          <p className="text-4xl font-bold tabular-nums mt-1">
            {formatCurrency(totals.totalAllTime)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
            <span>Este mes: {formatCurrency(totals.totalThisMonth)}</span>
          </div>
        </CardContent>
      </Card>

      {totals.byUserThisMonth.length > 0 && (
        <ContributionSummary
          total={totals.totalThisMonth.toFixed(2)}
          byUser={totals.byUserThisMonth.map((u) => ({
            userId: u.userId,
            name: u.name,
            total: u.total.toFixed(2),
          }))}
        />
      )}

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Meta principal</CardTitle>
          <ArrowRight className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="font-medium mb-1">{goal.name}</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totals.totalAllTime)}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              / {formatCurrency(goal.target)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (Number(totals.totalAllTime.toString()) / goal.target) * 100
                )}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Faltan{" "}
              {formatCurrency(
                Math.max(0, goal.target - Number(totals.totalAllTime.toString()))
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <Link
            href="/actividad"
            className="text-xs text-primary hover:underline"
          >
            Ver todo
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Todavía no hay aportes registrados
            </p>
          ) : (
            recent.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.user.name}</span>
                    {" aportó "}
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateShort(item.contributionDate)}
                    {item.note && ` · ${item.note}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CreateContributionButton className="w-full" />
    </div>
  );
}