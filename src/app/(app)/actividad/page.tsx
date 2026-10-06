import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";

export default async function ActividadPage() {
  const session = await auth();
  const hasCouple = !!session?.user?.coupleId;

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
          {hasCouple ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">Todavía no hay movimientos</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Cuando registren aportes o creen metas, aparecerán aquí.
              </p>
            </div>
          ) : (
            <NoCoupleEmptyState
              icon={Activity}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para ver el historial compartido."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}