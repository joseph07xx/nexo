"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Goal } from "lucide-react";
import { GoalCard } from "./goal-card";
import { GoalModal } from "./goal-modal";
import { ArchiveGoalDialog } from "./archive-goal-dialog";
import { updateGoalAction } from "../actions";
import type { SerializableGoalWithProgress } from "../types";

interface GoalsListProps {
  goals: SerializableGoalWithProgress[];
  emptyMessage?: string;
  emptyDescription?: string;
}

export function GoalsList({
  goals,
  emptyMessage = "Todavía no hay metas",
  emptyDescription = "Creen su primera meta para empezar a ahorrar juntos.",
}: GoalsListProps) {
  const router = useRouter();

  const [editId, setEditId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [unarchiveId, setUnarchiveId] = useState<string | null>(null);

  const editingGoal = editId
    ? goals.find((g) => g.id === editId) ?? null
    : null;

  const archivingGoal = archiveId
    ? goals.find((g) => g.id === archiveId) ?? null
    : null;

  const unarchivingGoal = unarchiveId
    ? goals.find((g) => g.id === unarchiveId) ?? null
    : null;

  const handleSuccess = useCallback(() => {
    setEditId(null);
    setArchiveId(null);
    setUnarchiveId(null);
    router.refresh();
  }, [router]);

  const updateAction = useCallback(
    async (
      prevState: Parameters<typeof updateGoalAction>[1],
      formData: FormData
    ) => {
      if (!editId) {
        return { success: false as const, error: "Meta no seleccionada" };
      }
      return updateGoalAction(editId, prevState, formData);
    },
    [editId]
  );

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Goal className="size-12 text-muted-foreground/40 mb-4" />
          <p className="font-medium">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {emptyDescription}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={setEditId}
            onArchive={setArchiveId}
            onUnarchive={setUnarchiveId}
          />
        ))}
      </div>

      {editingGoal && (
        <GoalModal
          open={!!editId}
          onClose={() => setEditId(null)}
          onSuccess={handleSuccess}
          title="Editar meta"
          action={updateAction}
          initialValues={{
            name: editingGoal.name,
            description: editingGoal.description ?? "",
            targetAmount: editingGoal.targetAmount,
            targetDate: editingGoal.targetDate
              ? editingGoal.targetDate.slice(0, 10)
              : "",
          }}
          submitLabel="Guardar cambios"
          pendingLabel="Guardando..."
        />
      )}

      {archivingGoal && (
        <ArchiveGoalDialog
          open={!!archiveId}
          onClose={() => setArchiveId(null)}
          onSuccess={handleSuccess}
          goalId={archivingGoal.id}
          goalName={archivingGoal.name}
          mode="archive"
        />
      )}

      {unarchivingGoal && (
        <ArchiveGoalDialog
          open={!!unarchiveId}
          onClose={() => setUnarchiveId(null)}
          onSuccess={handleSuccess}
          goalId={unarchivingGoal.id}
          goalName={unarchivingGoal.name}
          mode="unarchive"
        />
      )}
    </>
  );
}