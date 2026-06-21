import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/store/themeStore';

const data = [
  { month: 'Jan', new: 120, returning: 80 },
  { month: 'Feb', new: 145, returning: 95 },
  { month: 'Mar', new: 110, returning: 100 },
  { month: 'Apr', new: 180, returning: 120 },
  { month: 'May', new: 200, returning: 140 },
  { month: 'Jun', new: 165, returning: 155 },
  { month: 'Jul', new: 190, returning: 170 },
  { month: 'Aug', new: 220, returning: 180 },
  { month: 'Sep', new: 240, returning: 195 },
  { month: 'Oct', new: 210, returning: 200 },
  { month: 'Nov', new: 260, returning: 220 },
  { month: 'Dec', new: 290, returning: 250 },
];

export function CustomerChart() {
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Customer Acquisition</h3>
      <p className="text-sm text-neutral-500 mb-6">New vs returning customers</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a35' : '#e5e7eb'} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                return (
                  <div className="bg-white dark:bg-dark-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3">
                    <p className="text-xs font-medium text-neutral-500 mb-2">{label}</p>
                    {payload.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-neutral-700 dark:text-neutral-300">{entry.name}:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="new" fill="#6366f1" radius={[4, 4, 0, 0]} name="New" />
            <Bar dataKey="returning" fill="#10b981" radius={[4, 4, 0, 0]} name="Returning" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
