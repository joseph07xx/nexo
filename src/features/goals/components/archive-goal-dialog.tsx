"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { archiveGoalAction, unarchiveGoalAction } from "../actions";

interface ArchiveGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goalId: string;
  goalName: string;
  mode: "archive" | "unarchive";
}

export function ArchiveGoalDialog({
  open,
  onClose,
  onSuccess,
  goalId,
  goalName,
  mode,
}: ArchiveGoalDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "archive"
          ? await archiveGoalAction(goalId)
          : await unarchiveGoalAction(goalId);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  const isArchive = mode === "archive";

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
          {isArchive ? "Archivar meta" : "Restaurar meta"}
        </h2>

        <p className="text-sm text-muted-foreground mb-5">
          {isArchive ? (
            <>
              ¿Seguro que quieres archivar{" "}
              <span className="font-semibold text-foreground">{goalName}</span>?
              No aceptará nuevos aportes, pero conservará su historial.
            </>
          ) : (
            <>
              ¿Quieres restaurar{" "}
              <span className="font-semibold text-foreground">{goalName}</span>{" "}
              a metas activas?
            </>
          )}
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
            variant={isArchive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1"
          >
            {isPending
              ? isArchive
                ? "Archivando..."
                : "Restaurando..."
              : isArchive
                ? "Archivar"
                : "Restaurar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
