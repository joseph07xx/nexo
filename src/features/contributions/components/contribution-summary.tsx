import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";

interface ContributionSummaryProps {
  total: string;
  byUser: Array<{
    userId: string;
    name: string;
    total: string;
  }>;
}

export function ContributionSummary({ total, byUser }: ContributionSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="size-4" />
          Aportes de este mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {byUser.map((user) => (
          <div key={user.userId} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(user.total)}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="font-semibold tabular-nums text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}