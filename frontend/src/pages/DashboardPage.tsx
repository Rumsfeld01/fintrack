import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { analyticsService } from '../services/analytics'
import { transactionService } from '../services/transactions'
import { portfolioService } from '../services/portfolios'
import type { DashboardSummary, Transaction } from '../types'
import { formatCurrency, formatDate, isPositive } from '../utils/format'
import StatCard from '../components/ui/StatCard'
import PortfolioChart from '../components/charts/PortfolioChart'
import AllocationChart from '../components/charts/AllocationChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [dash, portfolios] = await Promise.all([
        analyticsService.getDashboard(),
        portfolioService.list(),
      ])
      setSummary(dash)

      // Fetch recent transactions across all portfolios
      if (portfolios.length > 0) {
        const allTxns = await Promise.all(
          portfolios.map(p => transactionService.list(p.id, { limit: 10 }))
        )
        const sorted = allTxns.flat()
          .sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime())
          .slice(0, 5)
        setRecentTxns(sorted)
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard…" />

  const gainPositive = summary ? isPositive(summary.total_gain_loss) : true

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your portfolio overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Portfolio Value"
          value={summary?.total_portfolio_value ?? '0'}
          icon={DollarSign}
          isCurrency={false}
          subtitle={`${summary?.portfolio_count ?? 0} portfolios`}
        />
        <StatCard
          title="Total Invested"
          value={summary?.total_invested ?? '0'}
          icon={Briefcase}
          isCurrency={false}
        />
        <StatCard
          title="Total Gain / Loss"
          value={formatCurrency(summary?.total_gain_loss ?? '0', 'KES')}
          icon={gainPositive ? TrendingUp : TrendingDown}
          variant={gainPositive ? 'gain' : 'loss'}
          isCurrency={false}
        />
        <StatCard
          title="Return"
          value={summary?.total_gain_loss_percent ?? '0'}
          icon={gainPositive ? TrendingUp : TrendingDown}
          variant={gainPositive ? 'gain' : 'loss'}
          isPercent
          isCurrency={false}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Performance chart */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold">Portfolio Performance</h2>
              <p className="text-slate-500 text-xs mt-0.5">30-day invested value</p>
            </div>
          </div>
          {summary && summary.recent_performance.length > 0 ? (
            <PortfolioChart data={summary.recent_performance} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">
              No performance data yet — add transactions to see the chart
            </div>
          )}
        </div>

        {/* Allocation chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-white font-semibold">Asset Allocation</h2>
            <p className="text-slate-500 text-xs mt-0.5">By instrument</p>
          </div>
          {summary && summary.allocation.length > 0 ? (
            <AllocationChart data={summary.allocation} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">
              No holdings yet
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Portfolios', value: summary?.portfolio_count ?? 0 },
          { label: 'Positions', value: summary?.holdings_count ?? 0 },
          { label: 'Instrument Types', value: summary?.allocation.length ?? 0 },
          { label: 'Recent Transactions', value: recentTxns.length },
        ].map(item => (
          <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="text-slate-500 text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-white font-semibold">Recent Transactions</h2>
          <Link
            to="/transactions"
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            View all →
          </Link>
        </div>
        {recentTxns.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No transactions yet.{' '}
            <Link to="/portfolios" className="text-emerald-400 hover:underline">
              Go to a portfolio
            </Link>{' '}
            to record your first trade.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentTxns.map(txn => (
              <div key={txn.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${txn.transaction_type === 'BUY' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {txn.transaction_type === 'BUY'
                      ? <ArrowUpRight size={16} className="text-emerald-400" />
                      : <ArrowDownRight size={16} className="text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {txn.transaction_type} {txn.instrument}
                    </p>
                    <p className="text-slate-500 text-xs">{formatDate(txn.trade_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{formatCurrency(txn.total_value, 'KES')}</p>
                  <p className="text-slate-500 text-xs">
                    {parseFloat(txn.quantity).toLocaleString()} × {formatCurrency(txn.unit_price, 'KES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
