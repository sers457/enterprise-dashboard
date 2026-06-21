import { Play, Pause, MoreHorizontal, Plus, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/UI/GlassCard';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Toggle } from '@/components/UI/Toggle';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';

const workflows = [
  { id: '1', name: 'Daily Revenue Report', description: 'Generates and emails revenue summary every morning', trigger: 'Schedule (Daily 8 AM)', status: 'active' as const, lastRun: 'Today 8:00 AM' },
  { id: '2', name: 'Lead Score Update', description: 'Updates lead scores based on recent engagement', trigger: 'Real-time', status: 'active' as const, lastRun: '2 min ago' },
  { id: '3', name: 'Inventory Alert', description: 'Sends alerts when stock levels are low', trigger: 'Event (Stock < threshold)', status: 'active' as const, lastRun: '1 hour ago' },
  { id: '4', name: 'Customer Churn Prediction', description: 'Analyzes patterns and flags at-risk customers', trigger: 'Schedule (Weekly)', status: 'inactive' as const, lastRun: '3 days ago' },
  { id: '5', name: 'Expense Report Audit', description: 'Reviews and flags unusual expense patterns', trigger: 'Event (New expense)', status: 'draft' as const, lastRun: 'Never' },
];

export default function WorkflowList() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">AI Workflows</h1>
          <Breadcrumb />
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="space-y-3">
        {workflows.map((wf) => (
          <GlassCard key={wf.id} className="p-5" hover>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{wf.name}</h3>
                    <Badge variant={wf.status === 'active' ? 'success' : wf.status === 'inactive' ? 'default' : 'warning'} dot size="sm">
                      {wf.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500">{wf.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                    <span>Trigger: {wf.trigger}</span>
                    <span>•</span>
                    <span>Last run: {wf.lastRun}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Toggle checked={wf.status === 'active'} onChange={() => {}} />
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
}
