import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useThemeStore } from '@/store/themeStore';

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function DonutChart({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
}: DonutChartProps) {
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Distribution</h3>
      <p className="text-sm text-neutral-500 mb-6">Category breakdown</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                const percent = ((item.value as number) / total * 100).toFixed(1);
                return (
                  <div className="bg-white dark:bg-dark-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.name}</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{item.value?.toLocaleString()}</p>
                    <p className="text-xs text-neutral-400">{percent}% of total</p>
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{total.toLocaleString()}</p>
            <p className="text-xs text-neutral-400">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
