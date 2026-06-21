import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag } from 'lucide-react';
import { GlassCard } from '@/components/UI/GlassCard';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Timeline } from '@/components/UI/Timeline';
import { Tabs } from '@/components/UI/Tabs';
import { useState } from 'react';

const mockCustomer = {
  id: '1',
  name: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '+1 (555) 123-4567',
  company: 'Acme Corp',
  status: 'active' as const,
  totalSpent: 45230,
  ordersCount: 34,
  tags: ['enterprise', 'saas', 'premium'],
};

export default function CustomerDetail() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activity');

  const timeline = [
    { id: '1', title: 'Order placed', description: 'INV-2024-001 - $12,500', timestamp: new Date().toISOString(), type: 'success' as const },
    { id: '2', title: 'Support ticket closed', description: 'Ticket #2841 - Resolved', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'info' as const },
    { id: '3', title: 'Subscription upgraded', description: 'Basic → Enterprise plan', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), type: 'warning' as const },
    { id: '4', title: 'Account created', timestamp: new Date(Date.now() - 365 * 86400000).toISOString(), type: 'default' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{mockCustomer.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xl font-bold">
              {mockCustomer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{mockCustomer.name}</h2>
              <Badge variant="success" dot size="sm">{mockCustomer.status}</Badge>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Mail className="h-4 w-4" /> {mockCustomer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Phone className="h-4 w-4" /> {mockCustomer.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <MapPin className="h-4 w-4" /> {mockCustomer.company}
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">${mockCustomer.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-neutral-400">Total Spent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{mockCustomer.ordersCount}</p>
                <p className="text-xs text-neutral-400">Orders</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {mockCustomer.tags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="lg:col-span-2 space-y-6">
          <Tabs
            tabs={[
              { id: 'activity', label: 'Activity' },
              { id: 'notes', label: 'Notes' },
              { id: 'transactions', label: 'Transactions' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
          />

          <GlassCard className="p-6">
            <Timeline items={timeline} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
