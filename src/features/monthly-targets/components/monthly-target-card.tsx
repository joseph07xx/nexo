"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Pencil } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { MonthlyTargetModal } from "./monthly-target-modal";
import type { SerializableMonthlyProgress } from "../types";

interface MonthlyTargetCardProps {
  progress: SerializableMonthlyProgress;
}

export function MonthlyTargetCard({ progress }: MonthlyTargetCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const year = progress.year;
  const month = progress.month;

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  const hasTarget = progress.hasTarget;

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Objetivo mensual</CardTitle>
          {hasTarget && (
            <button
              onClick={() => setOpen(true)}
              aria-label="Editar objetivo"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
        </CardHeader>

        <CardContent>
          {!hasTarget ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Target className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Aún no han establecido un objetivo para este mes.
              </p>
              <Button onClick={() => setOpen(true)} size="sm">
                Establecer objetivo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Ahorrado este mes
                  </p>
                  <p className="text-2xl font-semibold tabular-nums mt-0.5">
                    {formatCurrency(progress.totalSaved)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Objetivo
                  </p>
                  <p className="text-sm font-medium tabular-nums mt-0.5 text-muted-foreground">
                    {formatCurrency(progress.targetAmount)}
                  </p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress.isComplete ? "bg-success" : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(100, Number(progress.percentage))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground tabular-nums">
                  {Math.min(100, Number(progress.percentage)).toFixed(0)}%
                </span>
                {progress.isComplete ? (
                  <span className="text-success font-medium">
                    ¡Objetivo alcanzado!
                  </span>
                ) : (
                  <span className="text-muted-foreground tabular-nums">
                    Faltan {formatCurrency(progress.remaining)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MonthlyTargetModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        year={year}
        month={month}
        initialAmount={hasTarget ? progress.targetAmount : undefined}
        title={hasTarget ? "Editar objetivo mensual" : "Establecer objetivo mensual"}
        submitLabel={hasTarget ? "Guardar cambios" : "Establecer objetivo"}
        pendingLabel={hasTarget ? "Guardando..." : "Estableciendo..."}
      />
    </>
  );
}