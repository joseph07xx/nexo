"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  maxLength?: number;
}

export function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  required = true,
  value,
  onChange,
  invalid,
  maxLength = 100,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          aria-invalid={invalid}
          maxLength={maxLength}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}