import { useState } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, Code, BarChart3, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/UI/GlassCard';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Badge } from '@/components/UI/Badge';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: <BarChart3 className="h-4 w-4" />, text: 'Summarize this month\'s revenue' },
  { icon: <Lightbulb className="h-4 w-4" />, text: 'Suggest optimizations for customer retention' },
  { icon: <Code className="h-4 w-4" />, text: 'Generate a sales report query' },
  { icon: <Zap className="h-4 w-4" />, text: 'Analyze user engagement trends' },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you analyze data, generate reports, and optimize your business operations. How can I help you today?', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const responses = [
        'Based on the current data, revenue has increased by 23% this quarter compared to last. The growth is primarily driven by the Enterprise segment.',
        'I recommend focusing on improving the onboarding experience for new users. Companies that implement personalized onboarding see a 40% increase in retention.',
        'Here\'s a SQL query to generate a comprehensive sales report:\n\n```sql\nSELECT DATE_TRUNC(\'month\', created_at) as month,\n       SUM(amount) as revenue\nFROM transactions\nWHERE status = \'completed\'\nGROUP BY 1\nORDER BY 1;\n```',
        'User engagement has increased 15% week-over-week. The new feature rollout has positively impacted daily active users. Consider A/B testing the next iteration.',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const assistantMsg: Message = { id: Date.now().toString(), role: 'assistant', content: randomResponse, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">AI Assistant</h1>
          <Breadcrumb />
        </div>

        <GlassCard className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">DeepSeek AI</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </p>
            </div>
            <Badge variant="secondary" size="sm" className="ml-auto">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
              >
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                  msg.role === 'assistant' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-neutral-100 dark:bg-dark-800 text-neutral-600'
                )}>
                  {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'assistant'
                    ? 'bg-neutral-100 dark:bg-dark-800 text-neutral-900 dark:text-white'
                    : 'bg-primary-500 text-white'
                )}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <p className={cn('text-[10px] mt-1', msg.role === 'assistant' ? 'text-neutral-400' : 'text-primary-200')}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-600" />
                </div>
                <div className="bg-neutral-100 dark:bg-dark-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-4">
              <p className="text-xs text-neutral-400 mb-3 text-center">Try these suggestions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s.text); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-dark-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {s.icon}
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything about your business..."
                className="flex-1 bg-neutral-100 dark:bg-dark-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 text-neutral-900 dark:text-white placeholder-neutral-400"
              />
              <Button variant="primary" onClick={handleSend} disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="hidden lg:block w-72 space-y-4">
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Generate Report', icon: <BarChart3 className="h-4 w-4" /> },
              { label: 'Analyze Trends', icon: <Zap className="h-4 w-4" /> },
              { label: 'Optimize Workflow', icon: <Lightbulb className="h-4 w-4" /> },
            ].map((action, i) => (
              <button key={i} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-800 transition-colors">
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Capabilities</h3>
          <div className="space-y-2">
            {['Data Analysis', 'Report Generation', 'Code Writing', 'Business Insights', 'Forecasting'].map((cap, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-neutral-500">
                <Sparkles className="h-3 w-3 text-primary-500" />
                {cap}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
