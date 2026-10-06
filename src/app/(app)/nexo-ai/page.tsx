import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";

export default async function NexoAiPage() {
  const session = await auth();
  const hasCouple = !!session?.user?.coupleId;

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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="size-12 text-primary/40 mb-4" />
              <p className="font-medium">Nexo AI estará disponible próximamente</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Estamos trabajando para ayudarte a entender tus finanzas con inteligencia artificial.
              </p>
            </div>
          ) : (
            <NoCoupleEmptyState
              icon={Sparkles}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para acceder a Nexo AI."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}