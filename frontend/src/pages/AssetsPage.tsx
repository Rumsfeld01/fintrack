import { useEffect, useState } from 'react'
import { Search, Plus, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { assetService } from '../services/assets'
import type { Asset } from '../types'
import { formatCurrency } from '../utils/format'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { CATEGORY_COLORS } from '../utils/format'
import { type AxiosError } from 'axios'

const CATEGORY_BADGE: Record<string, 'green' | 'indigo' | 'blue' | 'yellow' | 'gray' | 'orange'> = {
  STOCK: 'green', CRYPTO: 'indigo', ETF: 'blue', BOND: 'yellow',
  CASH: 'gray', REAL_ESTATE: 'orange', COMMODITY: 'orange', OTHER: 'gray',
}

const CATEGORIES = ['STOCK', 'BOND', 'CRYPTO', 'CASH', 'ETF', 'REAL_ESTATE', 'COMMODITY', 'OTHER']

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    symbol: '', name: '', category: 'STOCK', current_price: '', currency: 'USD',
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await assetService.list(search || undefined)
      setAssets(data)
    } catch {
      toast.error('Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const created = await assetService.create({
        symbol: form.symbol,
        name: form.name,
        category: form.category,
        current_price: form.current_price,
        currency: form.currency,
      })
      setAssets(prev => [created, ...prev])
      toast.success(`${created.symbol} added`)
      setShowModal(false)
      setForm({ symbol: '', name: '', category: 'STOCK', current_price: '', currency: 'USD' })
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'Failed to create asset')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && assets.length === 0) return <LoadingSpinner message="Loading assets…" />

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets</h1>
          <p className="text-slate-400 text-sm mt-0.5">{assets.length} available asset{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Add Asset
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by symbol or name…"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Grid */}
      {assets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart2 size={22} className="text-slate-500" />
          </div>
          <p className="text-white font-medium mb-1">No assets found</p>
          <p className="text-slate-500 text-sm">Try a different search or add a new asset</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map(asset => {
            const color = CATEGORY_COLORS[asset.category] ?? '#64748b'
            return (
              <div key={asset.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{asset.symbol}</p>
                      <p className="text-slate-500 text-xs truncate max-w-28">{asset.name}</p>
                    </div>
                  </div>
                  <Badge variant={CATEGORY_BADGE[asset.category] ?? 'gray'}>
                    {asset.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                  <span className="text-slate-500 text-xs">Current Price</span>
                  <span className="text-white font-semibold">{formatCurrency(asset.current_price)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Asset">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Symbol</label>
              <input
                type="text"
                required
                value={form.symbol}
                onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                placeholder="AAPL"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                placeholder="USD"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Apple Inc."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Price</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={form.current_price}
                onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))}
                placeholder="150.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 border border-slate-700 text-slate-400 rounded-xl hover:border-slate-600 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl transition-colors text-sm font-medium"
            >
              {submitting ? 'Adding…' : 'Add Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
