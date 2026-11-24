import apiClient from './api';
import type { Asset } from '../types';

export const assetService = {
  async list(search?: string): Promise<Asset[]> {
    const { data } = await apiClient.get<Asset[]>('/assets', {
      params: search ? { search } : undefined,
    });
    return data;
  },

  async create(payload: {
    symbol: string;
    name: string;
    category: string;
    current_price: string;
    currency?: string;
  }): Promise<Asset> {
    const { data } = await apiClient.post<Asset>('/assets', payload);
    return data;
  },
};
