"use client";

import { X } from "lucide-react";
import { GoalForm, type GoalFormValues } from "./goal-form";
import type { GoalActionResult } from "../actions";

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  action: (
    prevState: GoalActionResult | null,
    formData: FormData
  ) => Promise<GoalActionResult>;
  initialValues?: Partial<GoalFormValues>;
  submitLabel?: string;
  pendingLabel?: string;
}

export function GoalModal({
  open,
  onClose,
  onSuccess,
  title,
  action,
  initialValues,
  submitLabel,
  pendingLabel,
}: GoalModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-lg max-h-[90vh] overflow-y-auto"
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

        <GoalForm
          action={action}
          initialValues={initialValues}
          onSuccess={onSuccess}
          onCancel={onClose}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
        />
      </div>
    </div>
  );
}