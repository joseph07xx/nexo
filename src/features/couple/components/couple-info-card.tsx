import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar } from "lucide-react";

interface CoupleInfoCardProps {
  currentUserName: string;
  partnerName: string;
  joinedAt: Date;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function CoupleInfoCard({
  currentUserName,
  partnerName,
  joinedAt,
}: CoupleInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="size-4" />
          Su pareja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {currentUserName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{currentUserName}</p>
            <p className="text-xs text-muted-foreground">Tú</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-secondary-foreground">
              {partnerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{partnerName}</p>
            <p className="text-xs text-muted-foreground">Tu pareja</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>Juntos desde {formatDate(joinedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}