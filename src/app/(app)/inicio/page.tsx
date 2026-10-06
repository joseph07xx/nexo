import Link from "next/link";
import { Info } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NexoLogo } from "@/components/brand/nexo-logo";
import { mockHomeData } from "@/features/home/data/mock";
import { Plus, ArrowRight, Users } from "lucide-react";

function formatCurrency(amount: number) {
  return `L ${amount.toLocaleString("es-HN")}`;
}

export default async function InicioPage() {
  const session = await auth();
  const data = mockHomeData;
  const hasCouple = !!session?.user?.coupleId;

  return (
    <div className="space-y-6">
      {/* Banner: sin pareja */}
      {!hasCouple && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              Aún no tienes pareja en NEXO.
            </p>
            <Link
              href="/perfil"
              className="text-sm font-medium text-primary hover:underline"
            >
              Creen una para empezar a ahorrar juntos →
            </Link>
          </div>
        </div>
      )}

      {/* Hero Card - Total Savings */}
      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="pt-6">
          <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
            Nuestro ahorro
          </p>

          <p className="text-4xl font-bold tabular-nums mt-1">
            {formatCurrency(data.summary.totalSaved)}
          </p>

          <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
            <span>
              Meta mensual: {formatCurrency(data.summary.monthlyGoal)}
            </span>

            <span className="size-1 rounded-full bg-current opacity-50" />

            <span>
              Este mes: {formatCurrency(data.summary.currentMonthSaved)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Progreso de octubre
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrency(data.summary.currentMonthSaved)}
            </span>

            <span className="text-sm text-muted-foreground">
              de {formatCurrency(data.summary.monthlyGoal)}
            </span>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${data.summary.progressPercentage}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Contributions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Aportes de este mes
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.contributions.user.name}
            </span>

            <span className="font-semibold tabular-nums">
              {formatCurrency(data.contributions.user.amount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.contributions.partner.name}
            </span>

            <span className="font-semibold tabular-nums">
              {formatCurrency(data.contributions.partner.amount)}
            </span>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-sm font-medium">
              Total
            </span>

            <span className="font-semibold tabular-nums text-primary">
              {formatCurrency(
                data.contributions.user.amount +
                  data.contributions.partner.amount
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Goal */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Meta principal
          </CardTitle>

          <ArrowRight className="size-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <p className="font-medium mb-1">
            {data.mainGoal.name}
          </p>

          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrency(data.mainGoal.current)}
            </span>

            <span className="text-sm text-muted-foreground tabular-nums">
              / {formatCurrency(data.mainGoal.target)}
            </span>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{
                width: `${data.mainGoal.percentage}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Faltan {formatCurrency(data.mainGoal.remaining)}
            </span>

            <span>
              ~{data.mainGoal.estimatedMonths} meses restantes
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Actividad reciente
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {data.recentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3"
            >
              <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {item.type === "contribution" && (
                    <>
                      <span className="font-medium">
                        {item.userName}
                      </span>

                      {" aportó "}

                      <span className="font-semibold tabular-nums">
                        {formatCurrency(item.amount!)}
                      </span>
                    </>
                  )}

                  {item.type === "milestone" && item.note}

                  {item.type === "goal_created" && item.note}
                </p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.date}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA Button */}
      <Button className="w-full h-12 text-base" size="lg">
        <Plus className="size-5 mr-2" />
        Registrar aporte
      </Button>
    </div>
  );
}
