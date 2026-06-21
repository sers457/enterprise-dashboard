import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/store/themeStore';

const data = [
  { month: 'Jan', users: 1200, active: 850 },
  { month: 'Feb', users: 1450, active: 1020 },
  { month: 'Mar', users: 1800, active: 1300 },
  { month: 'Apr', users: 2100, active: 1550 },
  { month: 'May', users: 2500, active: 1800 },
  { month: 'Jun', users: 2800, active: 2100 },
  { month: 'Jul', users: 3200, active: 2400 },
  { month: 'Aug', users: 3600, active: 2700 },
  { month: 'Sep', users: 4200, active: 3100 },
  { month: 'Oct', users: 4800, active: 3500 },
  { month: 'Nov', users: 5300, active: 3900 },
  { month: 'Dec', users: 6000, active: 4500 },
];

export function UserGrowthChart() {
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">User Growth</h3>
      <p className="text-sm text-neutral-500 mb-6">Total vs active users</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
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
                        <span className="font-semibold text-neutral-900 dark:text-white">{entry.value?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#usersGrad)" name="Total Users" />
            <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} fill="url(#activeGrad)" name="Active Users" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
