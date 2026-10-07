"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, Clock } from "lucide-react";
import { regenerateInvitationAction } from "../actions";
import { APP_TIMEZONE } from "@/utils/format-currency";

interface InvitationCardProps {
  code: string;
  expiresAt: Date;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function InvitationCard({ code, expiresAt }: InvitationCardProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [currentExpiresAt, setCurrentExpiresAt] = useState(expiresAt);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar. Copia el código manualmente.");
    }
  }

  function handleRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateInvitationAction();
      if (result.success) {
        setCurrentCode(result.data.code);
        setCurrentExpiresAt(new Date(result.data.expiresAt));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invitación pendiente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Comparte este código con tu pareja para que se una:
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-muted border border-border px-4 py-3 text-center">
            <span className="font-mono text-lg font-semibold tracking-wider text-primary">
              {currentCode}
            </span>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            aria-label="Copiar código"
            className="shrink-0"
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>Expira el {formatDate(currentExpiresAt)}</span>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isPending}
            className="w-full text-muted-foreground"
          >
            <RefreshCw className={`size-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Regenerando..." : "Regenerar código"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}