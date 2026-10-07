import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Check, Circle, Clock3, Mail, MapPin, UserRound, ArrowRight, Sparkles } from "lucide-react";
import {
  getActiveInvitationByCoupleId,
  getCoupleMemberByUserId,
  getCoupleWithMembers,
} from "@/features/couple/data";
import {
  CoupleProfileClient,
  type CoupleInitialState,
} from "@/features/couple/components/couple-profile-client";
import { countGoalsByStatus } from "@/features/goals/data";
import { countContributionsByCouple } from "@/features/contributions/data";
import { getMonthlyTarget } from "@/features/monthly-targets/data";
import { getIsoDateInAppTimezone } from "@/utils/format-currency";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userName = session.user.name ?? "Usuario";
  const membership = await getCoupleMemberByUserId(session.user.id);
  let initialState: CoupleInitialState = { kind: "no-couple" };
  let coupleConnected = false;
  let hasAnyGoal = false;
  let hasMonthlyTarget = false;
  let hasContributions = false;

  if (membership) {
    const [couple, invitation, goalCounts, contributionCount, monthKey] = await Promise.all([
      getCoupleWithMembers(membership.coupleId),
      getActiveInvitationByCoupleId(membership.coupleId),
      countGoalsByStatus(membership.coupleId),
      countContributionsByCouple(membership.coupleId),
      Promise.resolve(getIsoDateInAppTimezone().split("-").map(Number)),
    ]);

    const partner = couple?.members.find((member) => member.userId !== session.user.id);
    coupleConnected = !!partner;
    hasAnyGoal = goalCounts.active + goalCounts.completed > 0;
    hasContributions = contributionCount > 0;
    const [year, month] = monthKey;
    hasMonthlyTarget = !!(await getMonthlyTarget(membership.coupleId, year, month));

    if (partner) {
      initialState = {
        kind: "with-partner",
        currentUserName: userName,
        partnerName: partner.user.name,
        joinedAt: partner.joinedAt.toISOString(),
      };
    } else {
      initialState = invitation
        ? {
            kind: "owner-with-invitation",
            code: invitation.code,
            expiresAt: invitation.expiresAt.toISOString(),
          }
        : { kind: "owner-without-invitation" };
    }
  }

  const checklist = [
    { label: "Conectar con tu pareja", complete: coupleConnected, href: "/perfil", detail: "Compartan su espacio de ahorro." },
    { label: "Crear una meta", complete: hasAnyGoal, href: "/metas", detail: "Pongan un objetivo concreto al ahorro." },
    { label: "Definir el objetivo mensual", complete: hasMonthlyTarget, href: "/inicio", detail: "Elijan cuánto quieren ahorrar este mes." },
    { label: "Registrar el primer aporte", complete: hasContributions, href: "/actividad", detail: "Empiecen a ver el progreso en movimiento." },
  ];
  const completedSteps = checklist.filter((step) => step.complete).length;
  const setupPercentage = Math.round((completedSteps / checklist.length) * 100);
  const coupleStatus = coupleConnected
    ? "Con pareja"
    : membership
      ? "Invitación pendiente"
      : "Sin pareja";

  return (
    <div className="space-y-7 pb-8">
      <header>
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary"><UserRound className="size-4" /> NEXO · CUENTA Y HOGAR</p>
        <h1 className="text-3xl font-semibold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administra tu cuenta y el espacio que construyen juntos.</p>
      </header>

      <section className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold">{userName}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{session.user.email ?? "Correo no disponible"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:self-auto">
          <span className={`size-2 rounded-full ${coupleConnected ? "bg-success" : membership ? "bg-warning" : "bg-muted-foreground"}`} />
          {coupleStatus}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <section className="space-y-4" aria-labelledby="household-heading">
          <div>
            <h2 id="household-heading" className="text-xl font-semibold">Su hogar NEXO</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gestiona quién comparte este espacio de ahorro.</p>
          </div>
          <CoupleProfileClient initialState={initialState} />
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="account-heading">
          <div className="border-b border-border px-5 py-4">
            <h2 id="account-heading" className="font-semibold">Tu cuenta</h2>
            <p className="mt-1 text-xs text-muted-foreground">Datos asociados a tu sesión actual.</p>
          </div>
          <dl className="divide-y divide-border px-5">
            <AccountRow icon={UserRound} label="Nombre" value={userName} />
            <AccountRow icon={Mail} label="Correo electrónico" value={session.user.email ?? "No disponible"} />
            <AccountRow icon={MapPin} label="Zona horaria" value="GMT-6 · Centroamérica" />
          </dl>
          <div className="flex items-start gap-2.5 border-t border-border bg-muted/40 px-5 py-4">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-5 text-muted-foreground">Las fechas y horas de NEXO se muestran de acuerdo con GMT-6.</p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card" aria-labelledby="setup-heading">
        <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-5" /></div>
            <div>
              <h2 id="setup-heading" className="font-semibold">Puesta en marcha</h2>
              <p className="mt-1 text-sm text-muted-foreground">{completedSteps} de {checklist.length} pasos completados</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:w-48">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Configuración inicial" aria-valuenow={setupPercentage} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${setupPercentage}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{setupPercentage}%</span>
          </div>
        </div>
        <div className="divide-y divide-border px-5 sm:px-6">
          {checklist.map((step) => (
            <Link key={step.label} href={step.href} className="group flex items-center gap-3 py-4">
              <span className={`grid size-6 shrink-0 place-items-center rounded-full ${step.complete ? "bg-success/10 text-success" : "border border-border text-muted-foreground"}`}>
                {step.complete ? <Check className="size-3.5" /> : <Circle className="size-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${step.complete ? "text-muted-foreground" : "text-foreground"}`}>{step.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{step.detail}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {step.complete ? "Revisar" : "Continuar"} <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function AccountRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}