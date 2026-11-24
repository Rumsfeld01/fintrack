export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type BaseCurrency = 'KES' | 'USD';

export type AssetCategory =
  | 'STOCK' | 'BOND' | 'CRYPTO' | 'CASH' | 'ETF'
  | 'REAL_ESTATE' | 'COMMODITY' | 'OTHER';

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  category: AssetCategory;
  current_price: string;
  currency: string;
  description: string | null;
  created_at: string;
}

/** Per-instrument holding from /portfolios/{id}/summary */
export interface Holding {
  instrument: string;
  quantity: string;
  average_buy_price: string;
  total_invested: string;
  total_value: string;
  gain_loss: string;
  gain_loss_percent: string;
}

export interface Portfolio {
  id: number;
  name: string;
  client_name: string;
  base_currency: BaseCurrency;
  description: string | null;
  created_at: string;
}

export interface PortfolioSummary {
  portfolio_id: number;
  portfolio_name: string;
  client_name: string;
  base_currency: BaseCurrency;
  holdings: Holding[];
  total_invested: string;
  total_value: string;
  total_gain_loss: string;
  total_gain_loss_percent: string;
}

export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: number;
  portfolio_id: number;
  instrument: string;
  transaction_type: TransactionType;
  quantity: string;
  unit_price: string;
  total_value: string;
  trade_date: string;
  notes: string | null;
  created_at: string;
}

export interface AllocationItem {
  category: string;
  value: string;
  percentage: string;
}

export interface PerformancePoint {
  date: string;
  value: string;
}

export interface DashboardSummary {
  total_portfolio_value: string;
  total_invested: string;
  total_gain_loss: string;
  total_gain_loss_percent: string;
  portfolio_count: number;
  holdings_count: number;
  allocation: AllocationItem[];
  recent_performance: PerformancePoint[];
}
