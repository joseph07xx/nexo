import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const email = "admin@nexo.com";
const password = process.env.NEXO_ADMIN_PASSWORD;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está configurada.");
  process.exit(1);
}

if (!password) {
  console.error("Define NEXO_ADMIN_PASSWORD en el entorno antes de ejecutar este comando.");
  process.exit(1);
}

if (
  password.length < 8
  || password.length > 100
  || !/[A-Z]/.test(password)
  || !/[a-z]/.test(password)
  || !/[0-9]/.test(password)
) {
  console.error("La contraseña debe tener entre 8 y 100 caracteres, mayúscula, minúscula y número.");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      name: "Administrador NEXO",
      email,
      passwordHash,
      emailVerified: new Date(),
    },
    update: {
      passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log(`Cuenta de acceso preparada: ${email}`);
  console.log("La contraseña no se imprimió y solo se guardó su hash.");
} catch {
  console.error("No se pudo preparar la cuenta de acceso.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}