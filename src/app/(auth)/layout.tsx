import { NexoLogo } from "@/components/brand/nexo-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Activity, Target, Users } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary px-10 py-10 text-primary-foreground lg:flex xl:px-14">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-primary-foreground/10" />
          <div className="relative flex items-center gap-3">
            <NexoLogo size={36} />
            <span className="text-lg font-semibold tracking-tight">NEXO</span>
          </div>

          <div className="relative max-w-lg py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground/70">AHORRO COMPARTIDO</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Un plan que construyen en equipo.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-primary-foreground/75">
              Organicen sus metas, registren cada movimiento y avancen juntos con claridad.
            </p>

            <div className="mt-10 space-y-3 border-t border-primary-foreground/15 pt-6">
              <Feature icon={Target} title="Metas compartidas" detail="Un objetivo claro para cada plan." />
              <Feature icon={Activity} title="Movimientos visibles" detail="Aportes y retiros en un mismo libro." />
              <Feature icon={Users} title="Progreso en equipo" detail="Un espacio financiero para los dos." />
            </div>
          </div>

          <p className="relative text-xs text-primary-foreground/60">NEXO · Finanzas compartidas, con claridad.</p>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-4 py-20 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-7 flex items-center justify-center gap-2 lg:hidden">
              <NexoLogo size={32} />
              <span className="text-base font-semibold tracking-tight">NEXO</span>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Target;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary-foreground/15 bg-primary-foreground/[0.08]">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-primary-foreground/65">{detail}</span>
      </span>
    </div>
  );
}