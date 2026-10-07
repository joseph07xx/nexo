"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/features/auth/components/password-field";
import { registerUser, type RegisterState } from "@/features/auth/actions";
import { Check, Circle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creando cuenta..." : "Crear cuenta"}
    </Button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction] = useActionState<RegisterState | null, FormData>(
    registerUser,
    null
  );
  const [password, setPassword] = useState("");

  const passwordChecks = [
    { label: "Al menos 8 caracteres", valid: password.length >= 8 },
    { label: "Una letra mayúscula", valid: /[A-Z]/.test(password) },
    { label: "Una letra minúscula", valid: /[a-z]/.test(password) },
    { label: "Un número", valid: /[0-9]/.test(password) },
  ];

  useEffect(() => {
    if (state?.success) {
      router.push("/inicio");
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <Card className="border-border/80 shadow-lg shadow-foreground/[0.04]">
      <CardContent className="pt-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">COMIENZA CON NEXO</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Crea tu cuenta.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Su espacio compartido empieza aquí.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Tu nombre"
              required
              autoComplete="name"
              maxLength={100}
              aria-invalid={!!state?.fieldErrors?.name}
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nombre@nexo.com"
              required
              autoComplete="email"
              maxLength={255}
              aria-invalid={!!state?.fieldErrors?.email}
            />
            <p className="text-xs text-muted-foreground">Solo se aceptan direcciones @nexo.com.</p>
            {state?.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <PasswordField
              id="password"
              name="password"
              label="Contraseña"
              placeholder="Crea una contraseña"
              aria-invalid={!!state?.fieldErrors?.password}
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              maxLength={100}
            />
            {state?.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1" aria-label="Requisitos de contraseña">
              {passwordChecks.map((check) => (
                <li key={check.label} className={`flex items-center gap-1.5 text-[11px] ${check.valid ? "text-success" : "text-muted-foreground"}`}>
                  {check.valid ? <Check className="size-3.5 shrink-0" /> : <Circle className="size-3 shrink-0" />}
                  {check.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmar contraseña"
              placeholder="Escríbela otra vez"
              autoComplete="new-password"
              maxLength={100}
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
            />
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

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
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}