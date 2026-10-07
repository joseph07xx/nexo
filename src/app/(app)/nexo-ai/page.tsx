import Link from "next/link";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";

export default async function NexoAiPage() {
  const session = await auth();
  const hasCouple = !!session?.user?.coupleId;
  const userName = session?.user?.name ?? "pareja";

  const suggestions = hasCouple
    ? [
        {
          title: "Mantén el objetivo mensual",
          text: "Si llevas un ritmo constante, puedes lograr tu meta del mes sin presiones adicionales.",
        },
        {
          title: "Revisa tus metas abiertas",
          text: "Prioriza las metas de mayor impacto para tu ahorro compartido y evita dispersarte.",
        },
        {
          title: "Haz un aporte semanal",
          text: "Un aporte pequeño y constante suele ser más sostenible que esperar al final del mes.",
        },
      ]
    : [
        {
          title: "Crea una pareja",
          text: "Tu ahorro compartido empieza cuando ambos formen parte del mismo objetivo.",
        },
        {
          title: "Define tu primera meta",
          text: "Elige un objetivo concreto para que el ahorro tenga dirección y sentido.",
        },
        {
          title: "Pon un objetivo mensual",
          text: "Un plan mensual te ayuda a mantener la constancia y ver mejor el progreso.",
        },
      ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Nexo AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tu asistente financiero inteligente
        </p>
      </header>

      <Card>
        <CardContent>
          {hasCouple ? (
            <div className="space-y-6 py-2">
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <Sparkles className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    Hola, {userName}. Aquí va tu guía del día.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Te recomiendo mantener un ahorro constante para avanzar hacia tus metas juntos.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {suggestions.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Lightbulb className="size-4" />
                    </div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/metas"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Revisar metas
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/actividad"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Registrar aporte
                </Link>
              </div>
            </div>
          ) : (
            <NoCoupleEmptyState
              icon={Sparkles}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para activar tus recomendaciones de ahorro inteligente."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}