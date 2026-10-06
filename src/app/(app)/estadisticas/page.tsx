import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";

export default async function EstadisticasPage() {
  const session = await auth();
  const hasCouple = !!session?.user?.coupleId;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Análisis de su progreso compartido
        </p>
      </header>

      <Card>
        <CardContent>
          {hasCouple ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">Aún no hay datos suficientes</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Registren aportes para ver estadísticas y tendencias.
              </p>
            </div>
          ) : (
            <NoCoupleEmptyState
              icon={BarChart3}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para empezar a ver estadísticas."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}