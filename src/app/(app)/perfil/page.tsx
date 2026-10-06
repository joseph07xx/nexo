// src/app/(app)/perfil/page.tsx

import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail } from "lucide-react";
import { getCoupleMemberByUserId, getCoupleWithMembers, getActiveInvitationByCoupleId } from "@/features/couple/data";
import { CoupleProfileClient, type CoupleInitialState } from "@/features/couple/components/couple-profile-client";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await getCoupleMemberByUserId(session.user.id);

  let initialState: CoupleInitialState = { kind: "no-couple" };

  if (membership) {
    const couple = await getCoupleWithMembers(membership.coupleId);
    const partner = couple?.members.find((m) => m.userId !== session.user.id);

    if (partner) {
      initialState = {
        kind: "with-partner",
        currentUserName: session.user.name ?? "Tú",
        partnerName: partner.user.name,
        joinedAt: partner.joinedAt.toISOString(),
      };
    } else {
      const invitation = await getActiveInvitationByCoupleId(membership.coupleId);
      initialState = invitation
        ? {
            kind: "owner-with-invitation",
            code: invitation.code,
            expiresAt: invitation.expiresAt.toISOString(),
          }
        : { kind: "owner-without-invitation" };
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Tu cuenta de NEXO</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-medium">{session.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Correo electrónico</p>
              <p className="text-sm font-medium">{session.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CoupleProfileClient initialState={initialState} />
    </div>
  );
}