import apiClient from './api';
import type { Transaction } from '../types';

interface TransactionCreatePayload {
  instrument: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: string;
  unit_price: string;
  trade_date: string;
  notes?: string;
}

interface TransactionFilters {
  instrument?: string;
  transaction_type?: 'BUY' | 'SELL';
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

export const transactionService = {
  /** Nested under portfolio: GET /portfolios/{id}/transactions */
  async list(portfolioId: number, filters?: TransactionFilters): Promise<Transaction[]> {
    const { data } = await apiClient.get<Transaction[]>(
      `/portfolios/${portfolioId}/transactions`,
      { params: filters }
    );
    return data;
  },

  /** Nested under portfolio: POST /portfolios/{id}/transactions */
  async create(portfolioId: number, payload: TransactionCreatePayload): Promise<Transaction> {
    const { data } = await apiClient.post<Transaction>(
      `/portfolios/${portfolioId}/transactions`,
      payload
    );
    return data;
  },

  /** Standalone: DELETE /transactions/{id} */
  async delete(transactionId: number): Promise<void> {
    await apiClient.delete(`/transactions/${transactionId}`);
  },
};
