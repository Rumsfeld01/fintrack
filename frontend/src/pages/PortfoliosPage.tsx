import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Briefcase, Trash2, Pencil, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { portfolioService } from '../services/portfolios'
import type { Portfolio } from '../types'
import { formatDate } from '../utils/format'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { type AxiosError } from 'axios'

const CURRENCY_BADGE: Record<string, 'green' | 'blue'> = { KES: 'green', USD: 'blue' }

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Portfolio | null>(null)
  const [form, setForm] = useState({
    name: '', client_name: '', base_currency: 'KES' as 'KES' | 'USD', description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setPortfolios(await portfolioService.list())
    } catch {
      toast.error('Failed to load portfolios')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ name: '', client_name: '', base_currency: 'KES', description: '' })
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (p: Portfolio) => {
    setForm({ name: p.name, client_name: p.client_name, base_currency: p.base_currency, description: p.description ?? '' })
    setEditTarget(p)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.client_name.trim()) return
    setSubmitting(true)
    try {
      if (editTarget) {
        const updated = await portfolioService.update(editTarget.id, {
          name: form.name, client_name: form.client_name,
          base_currency: form.base_currency, description: form.description || undefined,
        })
        setPortfolios(ps => ps.map(p => p.id === updated.id ? updated : p))
        toast.success('Portfolio updated')
      } else {
        const created = await portfolioService.create({
          name: form.name, client_name: form.client_name,
          base_currency: form.base_currency, description: form.description || undefined,
        })
        setPortfolios(ps => [created, ...ps])
        toast.success('Portfolio created')
      }
      setShowModal(false)
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (p: Portfolio) => {
    if (!confirm(`Delete "${p.name}" for ${p.client_name}?\n\nThis will permanently delete all holdings and transactions.`)) return
    try {
      await portfolioService.delete(p.id)
      setPortfolios(ps => ps.filter(x => x.id !== p.id))
      toast.success('Portfolio deleted')
    } catch {
      toast.error('Failed to delete portfolio')
    }
  }

  if (loading) return <LoadingSpinner message="Loading portfolios…" />

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolios</h1>
          <p className="text-slate-400 text-sm mt-0.5">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> New Portfolio
        </button>
      </div>

      {portfolios.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-slate-500" />
          </div>
          <p className="text-white font-semibold mb-2">No portfolios yet</p>
          <p className="text-slate-500 text-sm mb-6">Create a portfolio to start tracking client investments</p>
          <button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
            Create Portfolio
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {portfolios.map(p => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Briefcase size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{p.name}</h3>
                  <p className="text-slate-500 text-xs">{p.client_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={CURRENCY_BADGE[p.base_currency] ?? 'gray'}>{p.base_currency}</Badge>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 mb-4">Created {formatDate(p.created_at)}</div>

            <Link to={`/portfolios/${p.id}`} className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-400 rounded-lg text-sm transition-colors">
              View Holdings & Transactions <ChevronRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Portfolio' : 'New Portfolio'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Portfolio Name <span className="text-red-400">*</span></label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. NSE Equity Portfolio"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Name <span className="text-red-400">*</span></label>
            <input required value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
              placeholder="e.g. Acme Pension Fund"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Base Currency</label>
            <div className="flex gap-3">
              {(['KES', 'USD'] as const).map(c => (
                <button key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, base_currency: c }))}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.base_currency === c ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description <span className="text-slate-500">(optional)</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Portfolio strategy or notes…" rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 border border-slate-700 text-slate-400 rounded-xl hover:border-slate-600 hover:text-white transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl transition-colors text-sm font-medium">
              {submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
