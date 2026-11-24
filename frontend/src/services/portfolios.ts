import apiClient from './api';
import type { Portfolio, PortfolioSummary } from '../types';

export const portfolioService = {
  async list(): Promise<Portfolio[]> {
    const { data } = await apiClient.get<Portfolio[]>('/portfolios');
    return data;
  },

  async get(id: number): Promise<Portfolio> {
    const { data } = await apiClient.get<Portfolio>(`/portfolios/${id}`);
    return data;
  },

  async getSummary(id: number): Promise<PortfolioSummary> {
    const { data } = await apiClient.get<PortfolioSummary>(`/portfolios/${id}/summary`);
    return data;
  },

  async create(payload: {
    name: string;
    client_name: string;
    base_currency: 'KES' | 'USD';
    description?: string;
  }): Promise<Portfolio> {
    const { data } = await apiClient.post<Portfolio>('/portfolios', payload);
    return data;
  },

  async update(id: number, payload: {
    name?: string;
    client_name?: string;
    base_currency?: 'KES' | 'USD';
    description?: string;
  }): Promise<Portfolio> {
    const { data } = await apiClient.put<Portfolio>(`/portfolios/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/portfolios/${id}`);
  },
};
