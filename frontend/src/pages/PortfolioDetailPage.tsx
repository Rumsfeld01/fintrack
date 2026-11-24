import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, TrendingDown, Plus,
  ArrowUpDown, ArrowUp, ArrowDown, Download,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { portfolioService } from '../services/portfolios'
import { transactionService } from '../services/transactions'
import type { Portfolio, PortfolioSummary, Transaction } from '../types'
import {
  formatCurrency, formatPercent, formatNumber, formatDate,
  isPositive, instrumentColor,
} from '../utils/format'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AllocationChart from '../components/charts/AllocationChart'
import { type AxiosError } from 'axios'

type SortField = 'trade_date' | 'instrument' | 'transaction_type' | 'quantity' | 'unit_price' | 'total_value'
type SortDir = 'asc' | 'desc'

const KNOWN_INSTRUMENTS = [
  'SCOM', 'KCB', 'EQTY', 'COOP', 'BAMB', 'EABL',
  'T-BILL-91', 'T-BILL-182', 'T-BOND-10',
  'AAPL', 'MSFT', 'SPYI', 'BTC', 'ETH',
]

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTxnModal, setShowTxnModal] = useState(false)

  // Filters
  const [filterInstrument, setFilterInstrument] = useState('')
  const [filterType, setFilterType] = useState('')

  // Sort
  const [sortField, setSortField] = useState<SortField>('trade_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Add-transaction form
  const [txnForm, setTxnForm] = useState({
    instrument: '', transaction_type: 'BUY' as 'BUY' | 'SELL',
    quantity: '', unit_price: '', notes: '',
    trade_date: new Date().toISOString().slice(0, 16),
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [p, s, t] = await Promise.all([
        portfolioService.get(Number(id)),
        portfolioService.getSummary(Number(id)),
        transactionService.list(Number(id), { limit: 200 }),
      ])
      setPortfolio(p)
      setSummary(s)
      setTransactions(t)
    } catch {
      toast.error('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // Sorted + filtered transactions
  const displayedTxns = useMemo(() => {
    let list = [...transactions]
    if (filterInstrument) list = list.filter(t => t.instrument === filterInstrument)
    if (filterType) list = list.filter(t => t.transaction_type === filterType)
    list.sort((a, b) => {
      let va: string | number = a[sortField as keyof Transaction] as string
      let vb: string | number = b[sortField as keyof Transaction] as string
      if (['quantity', 'unit_price', 'total_value'].includes(sortField)) {
        va = parseFloat(va as string)
        vb = parseFloat(vb as string)
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [transactions, filterInstrument, filterType, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-600" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-emerald-400" />
      : <ArrowDown size={12} className="text-emerald-400" />
  }

  const handleTxnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await transactionService.create(Number(id), {
        instrument: txnForm.instrument.toUpperCase(),
        transaction_type: txnForm.transaction_type,
        quantity: txnForm.quantity,
        unit_price: txnForm.unit_price,
        notes: txnForm.notes || undefined,
        trade_date: new Date(txnForm.trade_date).toISOString(),
      })
      toast.success('Transaction recorded')
      setShowTxnModal(false)
      setTxnForm(f => ({ ...f, instrument: '', quantity: '', unit_price: '', notes: '' }))
      load()
    } catch (err) {
      const msg = (err as AxiosError<{ detail: string }>)?.response?.data?.detail
      toast.error(msg ?? 'Transaction failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTxn = async (txn: Transaction) => {
    if (!confirm(`Delete this ${txn.transaction_type} of ${formatNumber(txn.quantity)} ${txn.instrument}?`)) return
    try {
      await transactionService.delete(txn.id)
      setTransactions(ts => ts.filter(t => t.id !== txn.id))
      toast.success('Transaction deleted')
      // Reload summary after deletion
      const s = await portfolioService.getSummary(Number(id))
      setSummary(s)
    } catch {
      toast.error('Failed to delete')
    }
  }

  // CSV export
  const exportCSV = () => {
    const header = 'Date,Instrument,Type,Quantity,Unit Price,Total Value,Notes\n'
    const rows = displayedTxns.map(t =>
      `${formatDate(t.trade_date)},${t.instrument},${t.transaction_type},${t.quantity},${t.unit_price},${t.total_value},"${t.notes ?? ''}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${portfolio?.name ?? 'transactions'}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingSpinner message="Loading portfolio…" />
  if (!portfolio) return <div className="p-6 text-slate-400">Portfolio not found.</div>

  const cur = portfolio.base_currency
  const pPositive = summary ? isPositive(summary.total_gain_loss) : true

  // Build allocation data from holdings for the chart
  const allocationData = (summary?.holdings ?? []).map(h => ({
    category: h.instrument,
    value: h.total_value,
    percentage: summary && parseFloat(summary.total_value) > 0
      ? String(parseFloat(h.total_value) / parseFloat(summary.total_value) * 100)
      : '0',
  }))

  const instruments = [...new Set(transactions.map(t => t.instrument))].sort()

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <Link to="/portfolios" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 w-fit">
          <ArrowLeft size={16} /> Back to Portfolios
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{portfolio.name}</h1>
              <Badge variant={cur === 'KES' ? 'green' : 'blue'}>{cur}</Badge>
            </div>
            <p className="text-slate-400 text-sm">Client: <span className="text-white">{portfolio.client_name}</span></p>
            {portfolio.description && <p className="text-slate-500 text-xs mt-1">{portfolio.description}</p>}
          </div>
          <button onClick={() => setShowTxnModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors">
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Value', value: formatCurrency(summary.total_value, cur) },
            { label: 'Total Invested', value: formatCurrency(summary.total_invested, cur) },
            { label: 'Gain / Loss', value: formatCurrency(summary.total_gain_loss, cur), colored: true },
            { label: 'Return', value: formatPercent(summary.total_gain_loss_percent), colored: true },
          ].map(item => (
            <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">{item.label}</p>
              <p className={`text-lg font-bold ${item.colored ? (pPositive ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Holdings + Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Holdings table */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-white font-semibold">Holdings Summary</h2>
            <p className="text-slate-500 text-xs mt-0.5">Per-instrument net position</p>
          </div>
          {!summary || summary.holdings.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">
              No holdings yet — add a BUY transaction to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Instrument', 'Qty', 'Avg Cost', 'Invested', 'Value', 'Gain/Loss', 'Return'].map(h => (
                      <th key={h} className="text-left text-slate-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {summary.holdings.map(h => {
                    const gl = isPositive(h.gain_loss)
                    const color = instrumentColor(h.instrument)
                    return (
                      <tr key={h.instrument} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: color + '25', color }}>
                              {h.instrument.slice(0, 2)}
                            </div>
                            <span className="text-white font-medium">{h.instrument}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white text-right">{formatNumber(h.quantity)}</td>
                        <td className="px-4 py-3 text-slate-300 text-right">{formatCurrency(h.average_buy_price, cur)}</td>
                        <td className="px-4 py-3 text-slate-300 text-right">{formatCurrency(h.total_invested, cur)}</td>
                        <td className="px-4 py-3 text-white font-medium text-right">{formatCurrency(h.total_value, cur)}</td>
                        <td className={`px-4 py-3 font-medium text-right ${gl ? 'text-emerald-400' : 'text-red-400'}`}>
                          {gl ? '+' : ''}{formatCurrency(h.gain_loss, cur)}
                        </td>
                        <td className={`px-4 py-3 font-medium text-right ${gl ? 'text-emerald-400' : 'text-red-400'}`}>
                          <span className="flex items-center justify-end gap-1">
                            {gl ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {formatPercent(h.gain_loss_percent)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Allocation chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">Allocation</h2>
          <p className="text-slate-500 text-xs mb-4">By instrument</p>
          {allocationData.length > 0
            ? <AllocationChart data={allocationData} />
            : <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">No holdings yet</div>
          }
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold">Transactions</h2>
            <p className="text-slate-500 text-xs mt-0.5">{displayedTxns.length} record{displayedTxns.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by instrument */}
            <select value={filterInstrument} onChange={e => setFilterInstrument(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">All Instruments</option>
              {instruments.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            {/* Filter by type */}
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">All Types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            {(filterInstrument || filterType) && (
              <button onClick={() => { setFilterInstrument(''); setFilterType('') }}
                className="text-slate-500 hover:text-white text-xs underline">Clear</button>
            )}
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs transition-colors">
              <Download size={12} /> CSV
            </button>
          </div>
        </div>

        {displayedTxns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {transactions.length === 0
              ? 'No transactions yet — click "Add Transaction" to record your first trade.'
              : 'No transactions match the current filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {[
                    { label: 'Date', field: 'trade_date' as SortField },
                    { label: 'Instrument', field: 'instrument' as SortField },
                    { label: 'Type', field: 'transaction_type' as SortField },
                    { label: 'Quantity', field: 'quantity' as SortField },
                    { label: 'Unit Price', field: 'unit_price' as SortField },
                    { label: 'Total Value', field: 'total_value' as SortField },
                    { label: 'Notes', field: null },
                    { label: '', field: null },
                  ].map(col => (
                    <th key={col.label}
                      className={`text-left text-slate-500 font-medium px-4 py-3 whitespace-nowrap ${col.field ? 'cursor-pointer hover:text-slate-300' : ''}`}
                      onClick={() => col.field && toggleSort(col.field)}>
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.field && <SortIcon field={col.field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {displayedTxns.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-800/40 group transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(txn.trade_date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{txn.instrument}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={txn.transaction_type === 'BUY' ? 'green' : 'red'}>{txn.transaction_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-white text-right">{formatNumber(txn.quantity)}</td>
                    <td className="px-4 py-3 text-slate-300 text-right">{formatCurrency(txn.unit_price, cur)}</td>
                    <td className="px-4 py-3 text-white font-medium text-right">{formatCurrency(txn.total_value, cur)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-36 truncate">{txn.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteTxn(txn)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={showTxnModal} onClose={() => setShowTxnModal(false)} title="Add Transaction" size="lg">
        <form onSubmit={handleTxnSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Instrument <span className="text-red-400">*</span>
              </label>
              <input list="instruments" required value={txnForm.instrument}
                onChange={e => setTxnForm(f => ({ ...f, instrument: e.target.value.toUpperCase() }))}
                placeholder="e.g. SCOM"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono uppercase" />
              <datalist id="instruments">
                {[...new Set([...KNOWN_INSTRUMENTS, ...instruments])].map(i => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
              <div className="flex gap-2 h-[50px]">
                {(['BUY', 'SELL'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setTxnForm(f => ({ ...f, transaction_type: t }))}
                    className={`flex-1 rounded-xl border text-sm font-medium transition-colors ${
                      txnForm.transaction_type === t
                        ? t === 'BUY' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-red-500/10 border-red-500 text-red-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Quantity <span className="text-red-400">*</span></label>
              <input type="number" required min="0.000001" step="any"
                value={txnForm.quantity} onChange={e => setTxnForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="1000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Unit Price ({cur}) <span className="text-red-400">*</span>
              </label>
              <input type="number" required min="0.000001" step="any"
                value={txnForm.unit_price} onChange={e => setTxnForm(f => ({ ...f, unit_price: e.target.value }))}
                placeholder="14.50"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Trade Date <span className="text-red-400">*</span></label>
            <input type="datetime-local" required value={txnForm.trade_date}
              onChange={e => setTxnForm(f => ({ ...f, trade_date: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes <span className="text-slate-500">(optional)</span></label>
            <input value={txnForm.notes} onChange={e => setTxnForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Rebalancing, quarterly purchase…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>

          {txnForm.quantity && txnForm.unit_price && (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Total Value</span>
              <span className="text-white font-semibold">
                {formatCurrency(
                  String(parseFloat(txnForm.quantity || '0') * parseFloat(txnForm.unit_price || '0')),
                  cur
                )}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowTxnModal(false)}
              className="flex-1 py-2.5 border border-slate-700 text-slate-400 rounded-xl hover:border-slate-600 hover:text-white transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className={`flex-1 py-2.5 font-medium text-white rounded-xl transition-colors text-sm disabled:opacity-50 ${
                txnForm.transaction_type === 'BUY' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400'
              }`}>
              {submitting ? 'Recording…' : `Record ${txnForm.transaction_type}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
