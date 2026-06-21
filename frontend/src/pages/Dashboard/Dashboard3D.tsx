import { DashboardGlobe } from '@/3d/DashboardGlobe';
import { ChartTo3D } from '@/3d/ChartTo3D';
import { AnimatedKPICube } from '@/3d/AnimatedKPICube';
import { GlassCard } from '@/components/UI/GlassCard';
import { Badge } from '@/components/UI/Badge';

export default function Dashboard3D() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">3D Dashboard</h1>
          <p className="text-sm text-neutral-500">Interactive 3D data visualization</p>
        </div>
        <Badge variant="primary" dot>Live 3D</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Global Data Map</h3>
          <p className="text-sm text-neutral-500 mb-4">Interactive globe with data points</p>
          <DashboardGlobe />
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">3D Bar Chart</h3>
          <p className="text-sm text-neutral-500 mb-4">Product performance visualization</p>
          <ChartTo3D />
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">KPI Cube</h3>
          <p className="text-sm text-neutral-500 mb-4">Performance indicator</p>
          <AnimatedKPICube value={85} />
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">KPI Cube</h3>
          <p className="text-sm text-neutral-500 mb-4">Growth metric</p>
          <AnimatedKPICube value={65} />
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">KPI Cube</h3>
          <p className="text-sm text-neutral-500 mb-4">Completion rate</p>
          <AnimatedKPICube value={92} />
        </GlassCard>
      </div>
    </div>
  );
}
