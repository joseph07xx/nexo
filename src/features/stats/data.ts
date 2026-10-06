import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// CONSULTAS
// ============================================

/**
 * Obtiene todos los aportes de una pareja con los campos mínimos
 * necesarios para el cálculo de estadísticas.
 *
 * Filtra por coupleId. Selecciona solo los campos usados.
 */
export async function getContributionsForStats(coupleId: string) {
  return prisma.savingsContribution.findMany({
    where: { coupleId },
    select: {
      id: true,
      userId: true,
      amount: true,
      contributionDate: true,
    },
    orderBy: {
      contributionDate: "asc",
    },
  });
}

/**
 * Obtiene todos los objetivos mensuales de una pareja.
 */
export async function getMonthlyTargetsForStats(coupleId: string) {
  return prisma.monthlyTarget.findMany({
    where: { coupleId },
    select: {
      year: true,
      month: true,
      targetAmount: true,
    },
    orderBy: [
      { year: "asc" },
      { month: "asc" },
    ],
  });
}

/**
 * Obtiene los miembros de la pareja con nombre.
 * Necesario para la distribución por usuario.
 */
export async function getCoupleMembers(coupleId: string) {
  return prisma.coupleMember.findMany({
    where: { coupleId },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Obtiene todos los datos necesarios para la página de estadísticas.
 * Ejecuta las queries en paralelo.
 */
export async function getStatsData(coupleId: string) {
  const [contributions, targets, members] = await Promise.all([
    getContributionsForStats(coupleId),
    getMonthlyTargetsForStats(coupleId),
    getCoupleMembers(coupleId),
  ]);

  return {
    contributions,
    targets,
    members,
  };
}