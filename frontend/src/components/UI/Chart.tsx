import {
  LineChart as RechartsLine,
  BarChart as RechartsBar,
  AreaChart as RechartsArea,
  PieChart as RechartsPie,
  Line,
  Bar,
  Area,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

interface ChartProps {
  data: Record<string, unknown>[];
  type?: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  xKey?: string;
  yKeys?: string[];
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
  className?: string;
  animate?: boolean;
}

const DEFAULT_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export function Chart({
  data,
  type = 'line',
  xKey = 'name',
  yKeys = ['value'],
  colors = DEFAULT_COLORS,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  height = 300,
  className,
  animate = true,
}: ChartProps) {
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  const tooltipContent = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white dark:bg-dark-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3">
        <p className="text-xs font-medium text-neutral-500 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-neutral-700 dark:text-neutral-300">{entry.name}:</span>
            <span className="font-semibold text-neutral-900 dark:text-white">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <RechartsLine data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a35' : '#e5e7eb'} vertical={false} />}
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={tooltipContent} />}
            {showLegend && <Legend />}
            {yKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                isAnimationActive={animate}
              />
            ))}
          </RechartsLine>
        );

      case 'bar':
        return (
          <RechartsBar data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a35' : '#e5e7eb'} vertical={false} />}
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={tooltipContent} />}
            {showLegend && <Legend />}
            {yKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[i % colors.length]}
                radius={[4, 4, 0, 0]}
                isAnimationActive={animate}
              />
            ))}
          </RechartsBar>
        );

      case 'area':
        return (
          <RechartsArea data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a35' : '#e5e7eb'} vertical={false} />}
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={tooltipContent} />}
            {showLegend && <Legend />}
            {yKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]}
                fillOpacity={0.1}
                strokeWidth={2}
                isAnimationActive={animate}
              />
            ))}
          </RechartsArea>
        );

      case 'donut':
      case 'pie':
        return (
          <RechartsPie>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={type === 'donut' ? 60 : 0}
              outerRadius={100}
              paddingAngle={2}
              isAnimationActive={animate}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={tooltipContent} />}
            {showLegend && <Legend />}
          </RechartsPie>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart() as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
