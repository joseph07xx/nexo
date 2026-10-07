import { z } from "zod";

export const ALLOWED_EMAIL_DOMAIN = "@nexo.com";
export const RESERVED_ADMIN_EMAIL = "admin@nexo.com";

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es demasiado largo")
      .trim(),
    email: z
      .string()
      .email("Correo electrónico inválido")
      .max(255, "El correo es demasiado largo")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(100, "La contraseña es demasiado larga")
      .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
      .regex(/[a-z]/, "Debe incluir al menos una minúscula")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .superRefine((data, context) => {
    if (!data.email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
      context.addIssue({
        code: "custom",
        message: "Solo se permiten correos @nexo.com",
        path: ["email"],
      });
    }

    if (data.email === RESERVED_ADMIN_EMAIL) {
      context.addIssue({
        code: "custom",
        message: "Esta dirección está reservada y no puede registrarse desde aquí",
        path: ["email"],
      });
    }
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email("Correo electrónico inválido")
    .max(255, "El correo es demasiado largo")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .max(100, "La contraseña es demasiado larga"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;