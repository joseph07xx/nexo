import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";

export default async function MetasPage() {
  const session = await auth();
  const hasCouple = !!session?.user?.coupleId;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Metas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sus objetivos de ahorro compartidos
        </p>
      </header>

      <Card>
        <CardContent>
          {hasCouple ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Target className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">Todavía no hay metas</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Creen su primera meta para empezar a ahorrar juntos.
              </p>
            </div>
          ) : (
            <NoCoupleEmptyState
              icon={Target}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para empezar a definir metas compartidas."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}