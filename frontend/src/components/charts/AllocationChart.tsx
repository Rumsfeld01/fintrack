import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { AllocationItem } from '../../types'
import { formatCurrency, CATEGORY_COLORS } from '../../utils/format'

interface Props {
  data: AllocationItem[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white font-medium text-sm">{item.name}</p>
      <p className="text-emerald-400 font-bold">{formatCurrency(item.value)}</p>
      <p className="text-slate-400 text-xs">{parseFloat(item.payload.percentage).toFixed(1)}%</p>
    </div>
  )
}

export default function AllocationChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: d.category,
    value: parseFloat(d.value),
    percentage: d.percentage,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name] ?? '#64748b'}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
          )}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
