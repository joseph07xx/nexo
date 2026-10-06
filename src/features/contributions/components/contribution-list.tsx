"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContributionItem } from "./contribution-item";
import { ContributionModal } from "./contribution-modal";
import { DeleteContributionDialog } from "./delete-contribution-dialog";
import {
  createContributionAction,
  updateContributionAction,
} from "../actions";
import type { SerializableContribution } from "../types";

export interface ContributionListProps {
  initialItems: SerializableContribution[];
  currentUserId: string;
  totalPages: number;
  currentPage: number;
  total: number;
  pageSize: number;
}

export function ContributionList({
  initialItems,
  currentUserId,
  totalPages,
  currentPage,
  total,
}: ContributionListProps) {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const editingContribution = editId
    ? initialItems.find((c) => c.id === editId) ?? null
    : null;

  const deletingContribution = deleteId
    ? initialItems.find((c) => c.id === deleteId) ?? null
    : null;

  const handleSuccess = useCallback(() => {
    setEditId(null);
    setDeleteId(null);
    router.refresh();
  }, [router]);

  function goToPage(page: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    router.push(`/actividad?${params.toString()}`);
  }

  const updateAction = useCallback(
    async (
      prevState: Parameters<typeof updateContributionAction>[1],
      formData: FormData
    ) => {
      if (!editId) {
        return { success: false as const, error: "Aporte no seleccionado" };
      }
      return updateContributionAction(editId, prevState, formData);
    },
    [editId]
  );

  if (initialItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="font-medium">Todavía no hay aportes</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Registren su primer aporte para empezar a ver el progreso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="py-2">
          {initialItems.map((contribution) => (
            <ContributionItem
              key={contribution.id}
              contribution={contribution}
              currentUserId={currentUserId}
              onEdit={setEditId}
              onDelete={setDeleteId}
            />
          ))}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentPage} de {totalPages} · {total} aportes
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {editingContribution && (
        <ContributionModal
          open={!!editId}
          onClose={() => setEditId(null)}
          onSuccess={handleSuccess}
          title="Editar aporte"
          action={updateAction}
          initialValues={{
            amount: editingContribution.amount,
            contributionDate: editingContribution.contributionDate.slice(0, 10),
            note: editingContribution.note ?? "",
          }}
          submitLabel="Guardar cambios"
          pendingLabel="Guardando..."
        />
      )}

      {deletingContribution && (
        <DeleteContributionDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onSuccess={handleSuccess}
          contributionId={deletingContribution.id}
          amount={deletingContribution.amount}
        />
      )}
    </>
  );
}