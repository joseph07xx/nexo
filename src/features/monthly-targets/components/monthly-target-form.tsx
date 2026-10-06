
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  upsertMonthlyTargetAction,
  type MonthlyTargetActionResult,
} from "../actions";

interface MonthlyTargetFormProps {
  year: number;
  month: number;
  initialAmount?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  pendingLabel?: string;
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function MonthlyTargetForm({
  year,
  month,
  initialAmount = "",
  onSuccess,
  onCancel,
  submitLabel = "Guardar",
  pendingLabel = "Guardando...",
}: MonthlyTargetFormProps) {
  const [state, formAction] = useActionState<
    MonthlyTargetActionResult | null,
    FormData
  >(upsertMonthlyTargetAction, null);

  const [targetAmount, setTargetAmount] = useState(initialAmount);

  const fieldErrors =
    state?.success === false ? state.fieldErrors : undefined;

  const error =
    state?.success === false ? state.error : undefined;

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <div className="space-y-2">
        <Label htmlFor="targetAmount">Monto objetivo (L)</Label>

        <Input
          id="targetAmount"
          name="targetAmount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          required
          autoComplete="off"
          aria-invalid={!!fieldErrors?.targetAmount}
          className="tabular-nums text-lg font-semibold"
        />

        {fieldErrors?.targetAmount && (
          <p className="text-xs text-destructive">
            {fieldErrors.targetAmount[0]}
          </p>
        )}
      </div>

      {error && !fieldErrors && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}

        <SubmitButton
          label={submitLabel}
          pendingLabel={pendingLabel}
        />
      </div>
    </form>
  );
}
