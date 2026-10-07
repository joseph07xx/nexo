"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/features/auth/components/password-field";
import { loginUser, type LoginState } from "@/features/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Ingresando..." : "Iniciar sesión"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState | null, FormData>(
    loginUser,
    null
  );

  return (
    <Card className="border-border/80 shadow-lg shadow-foreground/[0.04]">
      <CardContent className="pt-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">ACCESO A TU ESPACIO</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Qué bueno verte.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicia sesión para continuar con su plan de ahorro.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@nexo.com"
              required
              autoComplete="email"
              maxLength={255}
            />
          </div>

          <PasswordField
              id="password"
              name="password"
              label="Contraseña"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              maxLength={100}
            />

          {state?.error && (
            <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5">
              <p className="text-sm text-destructive">{state.error}</p>
            </div>
          )}

          <SubmitButton />
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}