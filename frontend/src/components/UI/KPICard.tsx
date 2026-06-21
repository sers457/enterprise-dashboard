import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'number' | 'percent';
  icon?: React.ReactNode;
  sparklineData?: { value: number }[];
  variant?: 'glass' | 'neu';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function KPICard({
  label,
  value,
  previousValue,
  format = 'number',
  icon,
  sparklineData,
  variant = 'glass',
  trend,
  className,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 40;
    const stepValue = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const computedTrend = trend || (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
        return val.toFixed(0);
    }
  };

  const defaultSparkline = Array.from({ length: 20 }, (_, i) => ({
    value: Math.random() * 100,
  }));

  const data = sparklineData || defaultSparkline;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5',
      variant === 'glass' 
        ? 'bg-white/70 dark:bg-dark-900/70 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg'
        : 'neu',
      'transition-all duration-300 hover:shadow-xl',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">{formatValue(displayValue)}</p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          computedTrend === 'up' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
          computedTrend === 'down' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          computedTrend === 'neutral' && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
        )}>
          {computedTrend === 'up' && <TrendingUp className="h-3 w-3" />}
          {computedTrend === 'down' && <TrendingDown className="h-3 w-3" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <div className="h-12 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`sparkline-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              fill={`url(#sparkline-${label})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
