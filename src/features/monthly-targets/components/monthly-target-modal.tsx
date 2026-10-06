"use client";

import { X } from "lucide-react";
import { MonthlyTargetForm } from "./monthly-target-form";

interface MonthlyTargetModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  year: number;
  month: number;
  initialAmount?: string;
  title?: string;
  submitLabel?: string;
  pendingLabel?: string;
}

export function MonthlyTargetModal({
  open,
  onClose,
  onSuccess,
  year,
  month,
  initialAmount,
  title = "Objetivo mensual",
  submitLabel = "Guardar",
  pendingLabel = "Guardando...",
}: MonthlyTargetModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-card border border-border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <MonthlyTargetForm
          year={year}
          month={month}
          initialAmount={initialAmount}
          onSuccess={onSuccess}
          onCancel={onClose}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
        />
      </div>
    </div>
  );
}