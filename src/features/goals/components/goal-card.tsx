"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, MoreVertical } from "lucide-react";
import { GoalProgress } from "./goal-progress";
import type { SerializableGoalWithProgress } from "../types";
import { formatDateLong } from "@/utils/format-currency";

interface GoalCardProps {
  goal: SerializableGoalWithProgress;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

export function GoalCard({
  goal,
  onEdit,
  onArchive,
  onUnarchive,
}: GoalCardProps) {
  const isActive = goal.status === "ACTIVE";
  const isArchived = goal.status === "ARCHIVED";

  return (
    <Card className="overflow-hidden border border-border/80 bg-card/90 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {isActive ? "Activa" : isArchived ? "Archivada" : "Meta"}
              </span>
            </div>
            <Link
              href={`/metas/${goal.id}`}
              className="text-base font-semibold tracking-tight text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {goal.name}
            </Link>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>

          <GoalActionsMenu
            goalId={goal.id}
            isActive={isActive}
            isArchived={isArchived}
            onEdit={onEdit}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <GoalProgress
          currentAmount={goal.currentAmount}
          targetAmount={goal.targetAmount}
          remaining={goal.remaining}
          percentage={goal.percentage}
          isComplete={goal.isComplete}
        />

        {goal.targetDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
            <Calendar className="size-3.5" />
            <span>Objetivo: {formatDateLong(new Date(goal.targetDate))}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// MENÚ DE ACCIONES
// ============================================

import { useState, useRef, useEffect } from "react";

interface GoalActionsMenuProps {
  goalId: string;
  isActive: boolean;
  isArchived: boolean;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

function GoalActionsMenu({
  goalId,
  isActive,
  isArchived,
  onEdit,
  onArchive,
  onUnarchive,
}: GoalActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Acciones"
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-lg border border-border bg-card shadow-lg py-1">
          {isActive && (
            <>
              <MenuItem
                onClick={() => {
                  onEdit(goalId);
                  setOpen(false);
                }}
              >
                Editar
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onArchive(goalId);
                  setOpen(false);
                }}
                variant="destructive"
              >
                Archivar
              </MenuItem>
            </>
          )}

          {isArchived && (
            <MenuItem
              onClick={() => {
                onUnarchive(goalId);
                setOpen(false);
              }}
            >
              Restaurar
            </MenuItem>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
        variant === "destructive"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}