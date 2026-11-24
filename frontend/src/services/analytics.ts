import apiClient from './api';
import type { DashboardSummary } from '../types';

export const analyticsService = {
  async getDashboard(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>('/analytics/dashboard');
    return data;
  },
};
