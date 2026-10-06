"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format-currency";
import { deleteContributionAction } from "../actions";

interface DeleteContributionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contributionId: string;
  amount: string;
}

export function DeleteContributionDialog({
  open,
  onClose,
  onSuccess,
  contributionId,
  amount,
}: DeleteContributionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteContributionAction(contributionId);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-card border border-border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight mb-2">
          Eliminar aporte
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          ¿Seguro que quieres eliminar este aporte de{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrency(amount)}
          </span>
          ? Esta acción no se puede deshacer.
        </p>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 mb-4">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  );
}