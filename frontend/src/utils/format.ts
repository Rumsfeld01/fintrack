import type { BaseCurrency } from '../types';

export function formatCurrency(
  value: string | number,
  currency: BaseCurrency | string = 'KES'
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return currency === 'KES' ? 'KES 0.00' : '$0.00';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00%';
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

export function formatNumber(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isPositive(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num >= 0;
}

export const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#10b981',
  CRYPTO: '#6366f1',
  ETF: '#3b82f6',
  BOND: '#f59e0b',
  CASH: '#64748b',
  REAL_ESTATE: '#ec4899',
  COMMODITY: '#f97316',
  OTHER: '#8b5cf6',
};

/** Instrument colour — reuse STOCK colour as default for NSE equities */
export function instrumentColor(instrument: string): string {
  if (instrument.startsWith('T-BILL') || instrument.startsWith('T-BOND')) return CATEGORY_COLORS.BOND;
  if (instrument === 'BTC' || instrument === 'ETH') return CATEGORY_COLORS.CRYPTO;
  return CATEGORY_COLORS.STOCK;
}
