import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

interface Card {
  value: number;
  [key: string]: any;
}

export interface Dashboard {
  generatedAt: string;
  currency: string;
  cards: {
    totalMembers: Card & { newThisMonth?: number; growthPct?: number };
    activeSessions: Card & { today?: number };
    monthlyRevenue: Card & { lastMonth?: number; growthPct?: number | null };
    avgAttendance: Card & { changePts?: number | null };
    activeTrainers: Card & { newThisMonth?: number };
    avgSessionTime: Card;
    memberRetention: Card;
    dailyActiveUsers: Card & { pctOfTotal?: number };
  };
  charts: {
    revenue: Array<{ date: string; revenue: number }>;
    memberGrowth: Array<{ month: string; members: number; newMembers: number }>;
    categoryDistribution: Array<{ name: string; value: number }>;
  };
  trainers: Array<{
    name: string;
    sessions: number;
    rating: number;
    revenue: number;
  }>;
}

class AnalyticsService {
  async getDashboard(tenantId: string): Promise<Dashboard> {
    const { data } = await api.get<Dashboard>(
      API_ENDPOINTS.ANALYTICS_DASHBOARD(tenantId),
    );
    return data;
  }
}

export const analyticsService = new AnalyticsService();
