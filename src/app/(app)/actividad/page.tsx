import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { NoCoupleEmptyState } from "@/components/layout/no-couple-empty-state";
import { listContributions } from "@/features/contributions/data";
import { ContributionList } from "@/features/contributions/components/contribution-list";
import { CreateContributionButton } from "@/features/contributions/components/create-contribution-button";
import { serializeContribution } from "@/features/contributions/types";
import { getActiveGoalsForSelect } from "@/features/goals/data";

interface ActividadPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ActividadPage({ searchParams }: ActividadPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasCouple = !!session.user.coupleId;
  const coupleId = session.user.coupleId;

  if (!hasCouple || !coupleId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historial de movimientos de su pareja
          </p>
        </header>

        <Card>
          <CardContent>
            <NoCoupleEmptyState
              icon={Activity}
              title="Necesitan una pareja primero"
              description="Creen o únanse a una pareja para ver el historial compartido."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [result, goalOptions] = await Promise.all([
    listContributions({
      coupleId,
      page,
    }),
    getActiveGoalsForSelect(coupleId),
  ]);

  const serializedItems = result.items.map(serializeContribution);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historial de movimientos de su pareja
          </p>
        </div>
        <CreateContributionButton
          size="default"
          label="Registrar"
          goalOptions={goalOptions}
        />
      </header>

      <ContributionList
        initialItems={serializedItems}
        currentUserId={session.user.id}
        totalPages={result.totalPages}
        currentPage={result.page}
        total={result.total}
        pageSize={result.pageSize}
      />
    </div>
  );
}