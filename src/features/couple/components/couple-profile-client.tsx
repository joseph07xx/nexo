"use client";

import { useState } from "react";
import { CoupleInfoCard } from "./couple-info-card";
import { CreateCoupleCard } from "./create-couple-card";
import { InvitationCard } from "./invitation-card";
import { JoinCoupleDialog } from "./join-couple-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export type CoupleInitialState =
  | { kind: "no-couple" }
  | { kind: "owner-with-invitation"; code: string; expiresAt: string }
  | { kind: "owner-without-invitation" }
  | {
      kind: "with-partner";
      currentUserName: string;
      partnerName: string;
      joinedAt: string;
    };

interface CoupleProfileClientProps {
  initialState: CoupleInitialState;
}

export function CoupleProfileClient({ initialState }: CoupleProfileClientProps) {
  const [state, setState] = useState<CoupleInitialState>(initialState);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  // Estado: Con pareja
  if (state.kind === "with-partner") {
    return (
      <CoupleInfoCard
        currentUserName={state.currentUserName}
        partnerName={state.partnerName}
        joinedAt={new Date(state.joinedAt)}
      />
    );
  }

  // Estado: Owner con invitación activa
  if (state.kind === "owner-with-invitation") {
    return (
      <InvitationCard
        code={state.code}
        expiresAt={new Date(state.expiresAt)}
      />
    );
  }

  // Estado: Owner sin invitación (raro, hay que regenerar)
  if (state.kind === "owner-without-invitation") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No tienes una invitación activa. Genera una nueva para invitar a tu pareja.
          </p>
          <RegenerateButton />
        </CardContent>
      </Card>
    );
  }

  // Estado: Sin pareja
  return (
    <>
      <CreateCoupleCard
        onCreateSuccess={(code) => {
          setState({
            kind: "owner-with-invitation",
            code,
            expiresAt: getFutureDate(7),
          });
        }}
        onJoinClick={() => setJoinDialogOpen(true)}
      />

      <JoinCoupleDialog
        open={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
      />
    </>
  );
}

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

// Placeholder — se reemplaza con el mismo botón de regeneración
function RegenerateButton() {
  return (
    <Button variant="outline" className="w-full" disabled>
      <RefreshCw className="size-4 mr-2" />
      Regenerar código (próximamente)
    </Button>
  );
}