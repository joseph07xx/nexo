"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { createCouple } from "../actions";

interface CreateCoupleCardProps {
  onCreateSuccess: (code: string) => void;
  onJoinClick: () => void;
}

export function CreateCoupleCard({
  onCreateSuccess,
  onJoinClick,
}: CreateCoupleCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createCouple();
      if (result.success) {
        onCreateSuccess(result.data.code);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="size-4" />
          Tu pareja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Aún no tienes pareja en NEXO. Creen una pareja o únete con un código.
        </p>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={handleCreate} disabled={isPending} className="w-full">
            <Users className="size-4 mr-2" />
            {isPending ? "Creando..." : "Crear pareja"}
          </Button>
          <Button
            onClick={onJoinClick}
            disabled={isPending}
            variant="outline"
            className="w-full"
          >
            <UserPlus className="size-4 mr-2" />
            Unirme con código
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}