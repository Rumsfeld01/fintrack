import { type LucideIcon } from 'lucide-react';
import { formatCurrency, formatPercent, isPositive } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: LucideIcon;
  variant?: 'default' | 'gain' | 'loss';
  isCurrency?: boolean;
  isPercent?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  variant = 'default',
  isCurrency = true,
  isPercent = false,
}: StatCardProps) {
  const positive = change ? isPositive(change) : true;

  const displayValue = isPercent
    ? formatPercent(value)
    : isCurrency
    ? formatCurrency(value)
    : value;

  const colorClass =
    variant === 'gain'
      ? 'text-emerald-400'
      : variant === 'loss'
      ? 'text-red-400'
      : 'text-white';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className="p-2 bg-slate-800 rounded-lg">
          <Icon size={16} className="text-slate-400" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>{displayValue}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      {change !== undefined && (
        <p className={`text-sm mt-2 font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatPercent(change)}
        </p>
      )}
    </div>
  );
}
