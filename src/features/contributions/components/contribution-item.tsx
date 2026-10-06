"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/utils/format-currency";
import type { SerializableContribution } from "../types";

interface ContributionItemProps {
  contribution: SerializableContribution;
  currentUserId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ContributionItem({
  contribution,
  currentUserId,
  onEdit,
  onDelete,
}: ContributionItemProps) {
  const isAuthor = contribution.userId === currentUserId;
  const contributionDate = new Date(contribution.contributionDate);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-primary">
          {contribution.user.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium truncate">{contribution.user.name}</p>
          <p className="text-sm font-semibold tabular-nums text-primary shrink-0">
            {formatCurrency(contribution.amount)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatDateShort(contributionDate)}
          </span>
          {contribution.note && (
            <>
              <span className="size-0.5 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {contribution.note}
              </span>
            </>
          )}
        </div>
      </div>

      {isAuthor && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(contribution.id)}
            aria-label="Editar aporte"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(contribution.id)}
            aria-label="Eliminar aporte"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}