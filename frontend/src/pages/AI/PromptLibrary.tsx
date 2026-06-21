import { Search, Copy, Check, Sparkles, BarChart3, Users, TrendingUp, Code, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/UI/GlassCard';
import { Input } from '@/components/UI/Input';
import { Badge } from '@/components/UI/Badge';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';

const prompts = [
  { id: '1', title: 'Revenue Analysis', description: 'Analyze revenue trends and provide growth insights', category: 'Analytics', icon: <BarChart3 className="h-4 w-4" />, prompt: 'Analyze the revenue data for the current quarter and identify key trends, growth areas, and potential risks.' },
  { id: '2', title: 'Customer Segmentation', description: 'Segment customers based on behavior and value', category: 'CRM', icon: <Users className="h-4 w-4" />, prompt: 'Segment our customer base by purchase behavior, lifetime value, and engagement metrics.' },
  { id: '3', title: 'Growth Forecast', description: 'Predict growth metrics for next quarter', category: 'Analytics', icon: <TrendingUp className="h-4 w-4" />, prompt: 'Forecast key growth metrics for the next quarter based on historical data and current trends.' },
  { id: '4', title: 'SQL Query Generator', description: 'Generate complex SQL queries for reports', category: 'Development', icon: <Code className="h-4 w-4" />, prompt: 'Generate a SQL query to calculate monthly recurring revenue and churn rate.' },
  { id: '5', title: 'Report Summary', description: 'Summarize monthly business reports', category: 'Reports', icon: <FileText className="h-4 w-4" />, prompt: 'Summarize the key findings from this month\'s business performance report.' },
  { id: '6', title: 'Churn Analysis', description: 'Identify churn risk factors and patterns', category: 'CRM', icon: <Users className="h-4 w-4" />, prompt: 'Analyze customer churn patterns and identify key risk factors and mitigation strategies.' },
];

export default function PromptLibrary() {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = prompts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [...new Set(prompts.map((p) => p.category))];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Prompt Library</h1>
        <Breadcrumb />
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {categories.map((cat) => {
        const catPrompts = filtered.filter((p) => p.category === cat);
        if (catPrompts.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catPrompts.map((prompt) => (
                <GlassCard key={prompt.id} className="p-5" hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        {prompt.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{prompt.title}</p>
                        <p className="text-xs text-neutral-400">{prompt.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(prompt.id, prompt.prompt)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-800 text-neutral-400 hover:text-primary-500 transition-colors"
                    >
                      {copiedId === prompt.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{prompt.prompt}</p>
                  <div className="mt-3">
                    <Badge variant="default" size="sm">{prompt.category}</Badge>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
