"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContributionActionResult } from "../actions";

export interface ContributionFormValues {
  amount: string;
  contributionDate: string;
  note: string;
  goalId: string;
}

export interface GoalOption {
  id: string;
  name: string;
}

interface ContributionFormProps {
  initialValues?: Partial<ContributionFormValues>;
  goalOptions?: GoalOption[];
  action: (
    prevState: ContributionActionResult | null,
    formData: FormData
  ) => Promise<ContributionActionResult>;
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

export function ContributionForm({
  initialValues,
  goalOptions = [],
  action,
  onSuccess,
  onCancel,
  submitLabel = "Registrar aporte",
  pendingLabel = "Registrando...",
}: ContributionFormProps) {
  const [state, formAction] = useActionState<
    ContributionActionResult | null,
    FormData
  >(action, null);

  const today = new Date().toISOString().slice(0, 10);

  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [contributionDate, setContributionDate] = useState(
    initialValues?.contributionDate ?? today
  );
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [goalId, setGoalId] = useState(initialValues?.goalId ?? "");

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
        <Label htmlFor="amount">Cantidad (L)</Label>

        <Input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoComplete="off"
          aria-invalid={!!fieldErrors?.amount}
          className="tabular-nums text-lg font-semibold"
        />

        {fieldErrors?.amount && (
          <p className="text-xs text-destructive">
            {fieldErrors.amount[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contributionDate">Fecha</Label>

        <Input
          id="contributionDate"
          name="contributionDate"
          type="date"
          value={contributionDate}
          onChange={(e) => setContributionDate(e.target.value)}
          max={today}
          required
          aria-invalid={!!fieldErrors?.contributionDate}
        />

        {fieldErrors?.contributionDate && (
          <p className="text-xs text-destructive">
            {fieldErrors.contributionDate[0]}
          </p>
        )}
      </div>

      {goalOptions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="goalId">Meta (opcional)</Label>

          <select
            id="goalId"
            name="goalId"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Sin meta</option>

            {goalOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <p className="text-xs text-muted-foreground">
            Solo se muestran metas activas.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="note">Nota (opcional)</Label>

        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={280}
          placeholder="Ej. Aporte de octubre"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />

        {fieldErrors?.note && (
          <p className="text-xs text-destructive">
            {fieldErrors.note[0]}
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