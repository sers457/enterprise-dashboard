import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useThemeStore } from '@/store/themeStore';

const data = [
  { stage: 'Leads', value: 1200, color: '#6366f1' },
  { stage: 'Contacted', value: 850, color: '#8b5cf6' },
  { stage: 'Qualified', value: 540, color: '#10b981' },
  { stage: 'Proposal', value: 320, color: '#f59e0b' },
  { stage: 'Negotiation', value: 180, color: '#f97316' },
  { stage: 'Closed Won', value: 95, color: '#ef4444' },
];

export function SalesPipeline() {
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Sales Pipeline</h3>
      <p className="text-sm text-neutral-500 mb-6">Lead conversion funnel</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a35' : '#e5e7eb'} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white dark:bg-dark-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{label}: {payload[0].value}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
