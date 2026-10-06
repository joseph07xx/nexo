import type { Prisma } from "@prisma/client";

/**
 * Tipos serializables para pasar de Server a Client Components.
 * Los Decimal se pasan como string para preservar precisión.
 */

export interface StatsSummary {
  totalAllTime: string;
  monthlyAverage: string;
  activeMonths: number;
  contributionsCount: number;
}

export interface MonthlyChartPointSerializable {
  key: string;
  year: number;
  month: number;
  total: string;
  target: string | null;
}

export interface UserDistributionItem {
  userId: string;
  name: string;
  total: string;
  percentage: string;
}

export interface BestWorstMonthSerializable {
  key: string;
  year: number;
  month: number;
  total: string;
}

export interface CumulativePointSerializable {
  key: string;
  year: number;
  month: number;
  monthly: string;
  cumulative: string;
}

export interface GoalCompletionSerializable {
  completed: number;
  total: number;
  percentage: string;
}

export interface StatsData {
  summary: StatsSummary;
  monthlyChart: MonthlyChartPointSerializable[];
  userDistribution: UserDistributionItem[];
  bestMonth: BestWorstMonthSerializable | null;
  worstMonth: BestWorstMonthSerializable | null;
  cumulative: CumulativePointSerializable[];
  goalCompletion: GoalCompletionSerializable;
  hasContributions: boolean;
  hasTargets: boolean;
}