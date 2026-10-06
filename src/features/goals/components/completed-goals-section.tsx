"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateLong } from "@/utils/format-currency";
import type { SerializableGoalWithProgress } from "../types";

interface CompletedGoalsSectionProps {
  completed: SerializableGoalWithProgress[];
  archived: SerializableGoalWithProgress[];
}

export function CompletedGoalsSection({
  completed,
  archived,
}: CompletedGoalsSectionProps) {
  const [open, setOpen] = useState(false);

  const total = completed.length + archived.length;

  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        Historial ({total})
      </button>

      {open && (
        <div className="space-y-4 pl-1">
          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Completadas ({completed.length})
              </p>
              {completed.map((goal) => (
                <HistoricalGoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Archivadas ({archived.length})
              </p>
              {archived.map((goal) => (
                <HistoricalGoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// FILA DE META HISTÓRICA
// ============================================

function HistoricalGoalRow({ goal }: { goal: SerializableGoalWithProgress }) {
  const isCompleted = goal.status === "COMPLETED";
  const isArchived = goal.status === "ARCHIVED";

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{goal.name}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </span>
            {isCompleted && goal.completedAt && (
              <>
                <span className="size-0.5 rounded-full bg-muted-foreground" />
                <span>Completada {formatDateLong(new Date(goal.completedAt))}</span>
              </>
            )}
            {isArchived && goal.archivedAt && (
              <>
                <span className="size-0.5 rounded-full bg-muted-foreground" />
                <span>Archivada {formatDateLong(new Date(goal.archivedAt))}</span>
              </>
            )}
          </div>
        </div>

        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
            isCompleted
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isCompleted ? "Completada" : "Archivada"}
        </span>
      </div>
    </div>
  );
}