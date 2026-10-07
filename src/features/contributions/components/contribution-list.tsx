"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContributionItem } from "./contribution-item";
import { DeleteContributionDialog } from "./delete-contribution-dialog";
import type { SerializableFinancialMovement } from "../types";

export interface ContributionListProps {
  initialItems: SerializableFinancialMovement[];
  currentUserId: string;
  totalPages: number;
  currentPage: number;
  total: number;
  pageSize: number;
  paginationPath?: string;
  focusId?: string;
}

export function ContributionList({
  initialItems,
  currentUserId,
  totalPages,
  currentPage,
  total,
  paginationPath = "/actividad",
  focusId,
}: ContributionListProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deletingContribution = deleteId
    ? initialItems.find((c) => c.id === deleteId && c.kind === "CONTRIBUTION") ?? null
    : null;

  const handleSuccess = useCallback(() => {
    setDeleteId(null);
    router.refresh();
  }, [router]);

  function goToPage(page: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    router.push(`${paginationPath}?${params.toString()}`);
  }

  if (initialItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="font-medium">Todavía no hay movimientos</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Los aportes y retiros aparecerán aquí conforme ocurran.
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
              highlighted={contribution.id === focusId}
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
            {currentPage} de {totalPages} · {total} movimientos
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