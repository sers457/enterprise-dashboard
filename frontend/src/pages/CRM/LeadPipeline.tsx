import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, User, DollarSign } from 'lucide-react';
import { GlassCard } from '@/components/UI/GlassCard';
import { Button } from '@/components/UI/Button';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { cn } from '@/lib/utils';

const stages = [
  { id: 'new', label: 'New Leads', color: 'bg-sky-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-primary-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-secondary-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-500' },
  { id: 'won', label: 'Closed Won', color: 'bg-emerald-500' },
];

const leads = Array.from({ length: 24 }, (_, i) => ({
  id: `lead-${i}`,
  name: ['Sarah Johnson', 'Mike Peters', 'Emily Clark', 'Robert Kim', 'Lisa Chen', 'James Wilson'][i % 6],
  company: ['TechStart', 'DataFlow', 'CloudNine', 'PrimeSys', 'Innovate', 'NexGen'][i % 6],
  value: Math.round(5000 + Math.random() * 95000),
  stage: stages[i % 6].id,
  probability: 20 + Math.floor(Math.random() * 80),
}));

export default function LeadPipeline() {
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Lead Pipeline</h1>
          <Breadcrumb />
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const totalValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
          return (
            <div key={stage.id} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', stage.color)} />
                  <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">{stage.label}</h3>
                  <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-dark-800 px-1.5 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-xs font-medium text-neutral-500">${(totalValue / 1000).toFixed(0)}k</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {stageLeads.map((lead) => (
                  <GlassCard
                    key={lead.id}
                    className={cn(
                      'p-4 cursor-grab active:cursor-grabbing transition-shadow',
                      draggedLead === lead.id && 'opacity-50'
                    )}
                    hover
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={lead.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{lead.name}</p>
                          <p className="text-xs text-neutral-400">{lead.company}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${(lead.value / 1000).toFixed(0)}k
                      </div>
                      <Badge variant={lead.probability > 50 ? 'success' : 'warning'} size="sm">
                        {lead.probability}%
                      </Badge>
                    </div>
                  </GlassCard>
                ))}
                {stageLeads.length === 0 && (
                  <div className="h-24 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                    <p className="text-xs text-neutral-400">No leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
