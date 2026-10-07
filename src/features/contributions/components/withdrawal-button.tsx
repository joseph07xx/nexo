"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/format-currency";
import { createWithdrawalAction } from "../actions";
import type { WithdrawalSource } from "../types";

const NO_GOAL_SOURCE = "__without_goal__";

export function WithdrawalButton({
  sources,
  className,
}: {
  sources: WithdrawalSource[];
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sourceKey, setSourceKey] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedSource = sources.find((source) =>
    source.goalId ? source.goalId === sourceKey : sourceKey === NO_GOAL_SOURCE
  );

  function closeDialog() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSource) {
      setError("Selecciona de dónde se descontará el retiro.");
      return;
    }

    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("note", note);
    formData.set("goalId", selectedSource.goalId ?? "");
    setError(null);

    startTransition(async () => {
      const result = await createWithdrawalAction(null, formData);
      if (result.success) {
        setOpen(false);
        setAmount("");
        setNote("");
        setSourceKey("");
        router.refresh();
      } else {
        setError(result.fieldErrors?.amount?.[0] ?? result.error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={sources.length === 0}
        className={className}
        title={sources.length === 0 ? "No hay saldo disponible para retirar" : undefined}
      >
        <ArrowDownToLine className="mr-2 size-4" /> Retirar dinero
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdrawal-title"
            className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">Libro financiero</p>
                <h2 id="withdrawal-title" className="mt-1 text-lg font-semibold">Retirar dinero</h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                aria-label="Cerrar retiro"
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <p className="text-sm leading-5 text-muted-foreground">
                El retiro se guardará como un movimiento nuevo y reducirá el saldo del origen elegido.
              </p>

              <div className="space-y-2">
                <Label htmlFor="withdrawal-source">¿De dónde se descontará?</Label>
                <select
                  id="withdrawal-source"
                  value={sourceKey}
                  onChange={(event) => {
                    setSourceKey(event.target.value);
                    setAmount("");
                    setError(null);
                  }}
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="" disabled>Selecciona una meta o el saldo sin meta</option>
                  {sources.map((source) => (
                    <option key={source.goalId ?? NO_GOAL_SOURCE} value={source.goalId ?? NO_GOAL_SOURCE}>
                      {source.goalId ? source.name : "Aportes sin meta"} · disponible {formatCurrency(source.available)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSource && (
                <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Saldo disponible en {selectedSource.goalId ? selectedSource.name : "aportes sin meta"}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatCurrency(selectedSource.available)}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="withdrawal-amount">Monto a retirar (L)</Label>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max={selectedSource?.available}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  required
                  disabled={!selectedSource}
                  className="tabular-nums text-lg font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal-note">Nota (opcional)</Label>
                <Input
                  id="withdrawal-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={280}
                  placeholder="Motivo del retiro"
                />
              </div>

              {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>Cancelar</Button>
                <Button type="submit" disabled={isPending || !selectedSource}>
                  {isPending ? "Registrando..." : "Confirmar retiro"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}