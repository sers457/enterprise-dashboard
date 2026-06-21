import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/store/themeStore';

const data = [
  { product: 'Analytics Pro', revenue: 45000, growth: 23 },
  { product: 'Cloud Suite', revenue: 38000, growth: 18 },
  { product: 'Security+', revenue: 32000, growth: 12 },
  { product: 'Data Hub', revenue: 28000, growth: 8 },
  { product: 'AI Engine', revenue: 22000, growth: 35 },
  { product: 'Mobile SDK', revenue: 18000, growth: -5 },
  { product: 'Dev Tools', revenue: 15000, growth: 15 },
  { product: 'API Gateway', revenue: 12000, growth: 10 },
];

export function ProductPerformance() {
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Product Performance</h3>
      <p className="text-sm text-neutral-500 mb-6">Revenue by product</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a35' : '#e5e7eb'} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis dataKey="product" type="category" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const item = data.find((d) => d.product === label);
                return (
                  <div className="bg-white dark:bg-dark-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">{label}</p>
                    <p className="text-sm text-neutral-500">Revenue: <span className="font-semibold text-neutral-900 dark:text-white">${payload[0].value?.toLocaleString()}</span></p>
                    <p className="text-sm text-neutral-500">Growth: <span className={`font-semibold ${(item?.growth ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{item?.growth}%</span></p>
                  </div>
                );
              }}
            />
            <Bar dataKey="revenue" fill="#6366f1" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
