"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GoalActionResult } from "../actions";

export interface GoalFormValues {
  name: string;
  description: string;
  targetAmount: string;
  targetDate: string;
}

interface GoalFormProps {
  initialValues?: Partial<GoalFormValues>;
  action: (
    prevState: GoalActionResult | null,
    formData: FormData
  ) => Promise<GoalActionResult>;
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

export function GoalForm({
  initialValues,
  action,
  onSuccess,
  onCancel,
  submitLabel = "Crear meta",
  pendingLabel = "Creando...",
}: GoalFormProps) {
  const [state, formAction] = useActionState<
    GoalActionResult | null,
    FormData
  >(action, null);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [targetAmount, setTargetAmount] = useState(
    initialValues?.targetAmount ?? ""
  );
  const [targetDate, setTargetDate] = useState(
    initialValues?.targetDate ?? ""
  );

  const fieldErrors =
    state?.success === false ? state.fieldErrors : undefined;

  const error = state?.success === false ? state.error : undefined;

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>

        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Ej. Viaje a Roatán"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          autoComplete="off"
          aria-invalid={!!fieldErrors?.name}
        />

        {fieldErrors?.name && (
          <p className="text-xs text-destructive">
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>

        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          placeholder="¿Para qué es esta meta?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />

        {fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {fieldErrors.description[0]}
          </p>
        )}
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="targetDate">Fecha objetivo (opcional)</Label>

        <Input
          id="targetDate"
          name="targetDate"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          aria-invalid={!!fieldErrors?.targetDate}
        />

        {fieldErrors?.targetDate && (
          <p className="text-xs text-destructive">
            {fieldErrors.targetDate[0]}
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