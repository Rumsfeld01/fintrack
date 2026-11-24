import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { transactionService } from '../services/transactions'
import { portfolioService } from '../services/portfolios'
import type { Transaction, Portfolio } from '../types'
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPortfolio, setSelectedPortfolio] = useState('')
  const [filterType, setFilterType] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const ports = await portfolioService.list()
      setPortfolios(ports)

      if (ports.length > 0) {
        // Load transactions from all portfolios
        const allTxns = await Promise.all(
          ports.map(p => transactionService.list(p.id, { limit: 200 }))
        )
        setTransactions(allTxns.flat().sort(
          (a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
        ))
      }
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = transactions.filter(t => {
    if (selectedPortfolio && String(t.portfolio_id) !== selectedPortfolio) return false
    if (filterType && t.transaction_type !== filterType) return false
    return true
  })

  const totalBuy = filtered.filter(t => t.transaction_type === 'BUY').reduce((s, t) => s + parseFloat(t.total_value), 0)
  const totalSell = filtered.filter(t => t.transaction_type === 'SELL').reduce((s, t) => s + parseFloat(t.total_value), 0)

  const portfolioFor = (id: number) => portfolios.find(p => p.id === id)

  if (loading) return <LoadingSpinner message="Loading transactions…" />

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">All Transactions</h1>
        <p className="text-slate-400 text-sm mt-0.5">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs mb-1">Records</p>
          <p className="text-white font-bold text-xl">{filtered.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs mb-1">Total Bought</p>
          <p className="text-emerald-400 font-bold text-xl">{formatNumber(totalBuy)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs mb-1">Total Sold</p>
          <p className="text-red-400 font-bold text-xl">{formatNumber(totalSell)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={14} /> <span className="text-sm">Filter:</span>
        </div>
        <select value={selectedPortfolio} onChange={e => setSelectedPortfolio(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
          <option value="">All Portfolios</option>
          {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
          <option value="">All Types</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        {(selectedPortfolio || filterType) && (
          <button onClick={() => { setSelectedPortfolio(''); setFilterType('') }}
            className="text-slate-500 hover:text-white text-sm underline">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {transactions.length === 0
              ? <>No transactions yet. <Link to="/portfolios" className="text-emerald-400 hover:underline">Go to a portfolio</Link> to add one.</>
              : 'No transactions match the current filters.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Type', 'Instrument', 'Portfolio', 'Quantity', 'Unit Price', 'Total Value', 'Date'].map(h => (
                    <th key={h} className="text-left text-slate-500 font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(txn => {
                  const p = portfolioFor(txn.portfolio_id)
                  const cur = p?.base_currency ?? 'KES'
                  return (
                    <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className={`flex items-center gap-1.5 ${txn.transaction_type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {txn.transaction_type === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          <Badge variant={txn.transaction_type === 'BUY' ? 'green' : 'red'}>{txn.transaction_type}</Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white font-medium">{txn.instrument}</td>
                      <td className="px-5 py-3">
                        <Link to={`/portfolios/${txn.portfolio_id}`} className="text-slate-400 hover:text-emerald-400 text-xs">
                          {p?.name ?? `Portfolio ${txn.portfolio_id}`}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-white text-right">{formatNumber(txn.quantity)}</td>
                      <td className="px-5 py-3 text-slate-300 text-right">{formatCurrency(txn.unit_price, cur)}</td>
                      <td className="px-5 py-3 text-white font-medium text-right">{formatCurrency(txn.total_value, cur)}</td>
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{formatDateTime(txn.trade_date)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
