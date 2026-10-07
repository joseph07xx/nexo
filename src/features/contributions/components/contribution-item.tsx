"use client";

import { ArrowDownLeft, ArrowUpRight, Trash2, Target } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/utils/format-currency";
import type { SerializableFinancialMovement } from "../types";

interface ContributionItemProps {
  contribution: SerializableFinancialMovement;
  currentUserId: string;
  highlighted?: boolean;
  onDelete: (id: string) => void;
}

export function ContributionItem({
  contribution,
  currentUserId,
  highlighted = false,
  onDelete,
}: ContributionItemProps) {
  const isAuthor = contribution.userId === currentUserId;
  const isWithdrawal = contribution.kind === "WITHDRAWAL";
  const movementDate = new Date(
    isWithdrawal ? contribution.withdrawalDate : contribution.contributionDate
  );

  return (
    <div
      id={`movement-${contribution.id}`}
      className={`flex items-start gap-3 py-3 border-b border-border last:border-b-0 ${
        highlighted ? "rounded-lg bg-primary/5 px-3 ring-1 ring-primary/20" : ""
      }`}
    >
      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-primary">
          {contribution.user.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium truncate">
            {contribution.user.name} {isWithdrawal ? "retiró" : "aportó"}
          </p>
          <p className={`shrink-0 text-sm font-semibold tabular-nums ${isWithdrawal ? "text-destructive" : "text-primary"}`}>
            {isWithdrawal ? "- " : "+ "}{formatCurrency(contribution.amount)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatDateShort(movementDate)}
          </span>

          <span className={`inline-flex items-center gap-1 text-xs ${isWithdrawal ? "text-destructive" : "text-success"}`}>
            {isWithdrawal ? <ArrowDownLeft className="size-3" /> : <ArrowUpRight className="size-3" />}
            {isWithdrawal ? "Retiro" : "Aporte"}
          </span>

          {contribution.goal ? (
            <>
              <span className="size-0.5 rounded-full bg-muted-foreground" />
              <span className={`inline-flex items-center gap-1 text-xs ${isWithdrawal ? "text-destructive" : "text-primary"}`}>
                <Target className="size-3" />
                {contribution.goal.name}
              </span>
            </>
          ) : (
            <>
              <span className="size-0.5 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground italic">
                {isWithdrawal ? "Saldo sin meta" : "Sin meta"}
              </span>
            </>
          )}

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

      {isAuthor && !isWithdrawal && (
        <div className="flex items-center gap-1 shrink-0">
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