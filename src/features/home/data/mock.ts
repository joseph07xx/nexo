/**
 * ⚠️ DATOS TEMPORALES DE DISEÑO
 * Estos datos son únicamente para visualizar la interfaz en Fase 1.
 * Serán eliminados cuando se implemente la base de datos en Fase 4.
 */

export const mockHomeData = {
  user: {
    name: "María",
    partnerName: "Carlos",
  },
  summary: {
    totalSaved: 18500,
    monthlyGoal: 3000,
    currentMonthSaved: 2700,
    progressPercentage: 90,
  },
  contributions: {
    user: { name: "María", amount: 1500 },
    partner: { name: "Carlos", amount: 1200 },
  },
  mainGoal: {
    name: "Viaje a Roatán",
    current: 18500,
    target: 30000,
    percentage: 62,
    remaining: 11500,
    targetDate: "2027-03-15",
    estimatedMonths: 4,
  },
  recentActivity: [
    {
      id: "1",
      type: "contribution" as const,
      userName: "María",
      amount: 1500,
      date: "Hoy",
      note: "Aporte de octubre",
    },
    {
      id: "2",
      type: "contribution" as const,
      userName: "Carlos",
      amount: 1200,
      date: "Ayer",
      note: null,
    },
    {
      id: "3",
      type: "milestone" as const,
      userName: null,
      amount: null,
      date: "5 Oct",
      note: "Alcanzaron L 15,000 en su meta principal",
    },
    {
      id: "4",
      type: "goal_created" as const,
      userName: null,
      amount: null,
      date: "1 Oct",
      note: 'Crearon la meta "Viaje a Roatán"',
    },
  ],
};