import Link from "next/link";
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
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Icon className="size-7 text-muted-foreground" />
      </div>

      <p className="font-medium">{title}</p>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {description}
      </p>

      <Link
        href="/perfil"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <Users className="mr-2 size-4" />
        Ir a perfil
      </Link>
    </div>
  );
}