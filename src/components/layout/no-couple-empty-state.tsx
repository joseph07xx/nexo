import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NoCoupleEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function NoCoupleEmptyState({
  icon: Icon,
  title,
  description,
}: NoCoupleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      <Button asChild className="mt-6">
        <Link href="/perfil">
          <Users className="size-4 mr-2" />
          Ir a perfil
        </Link>
      </Button>
    </div>
  );
}