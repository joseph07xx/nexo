"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/schemas/auth";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type RegisterState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerUser(
  prevState: RegisterState | null,
  formData: FormData
): Promise<RegisterState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // Mensaje genérico para no facilitar enumeración
      return {
        fieldErrors: {
          email: ["No fue posible crear la cuenta con estos datos"],
        },
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Iniciar sesión automáticamente tras registro
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return {
      error: "Ocurrió un error inesperado. Intenta de nuevo.",
    };
  }
}

export type LoginState = {
  error?: string;
};

export async function loginUser(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/inicio",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Correo o contraseña incorrectos" };
        default:
          return { error: "No fue posible iniciar sesión. Intenta de nuevo." };
      }
    }
    throw error;
  }
}