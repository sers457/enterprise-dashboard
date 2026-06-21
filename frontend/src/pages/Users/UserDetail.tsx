import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Shield, Clock, Smartphone } from 'lucide-react';
import { GlassCard } from '@/components/UI/GlassCard';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Toggle } from '@/components/UI/Toggle';
import { Timeline } from '@/components/UI/Timeline';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import type { UserRole } from '@/types';

const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@company.com',
  username: 'johndoe',
  role: 'super_admin' as UserRole,
  isActive: true,
  isMFAEnabled: true,
  lastLogin: new Date().toISOString(),
  createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const activityTimeline = [
    { id: '1', title: 'User logged in', description: 'From Chrome on Windows', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), type: 'success' as const },
    { id: '2', title: 'Password changed', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'warning' as const },
    { id: '3', title: 'Profile updated', description: 'Changed profile picture', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'info' as const },
    { id: '4', title: 'MFA enabled', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'success' as const },
    { id: '5', title: 'Account created', timestamp: mockUser.createdAt, type: 'default' as const },
  ];

  const sessions = [
    { device: 'Chrome / Windows', ip: '192.168.1.1', lastActive: 'Active now', current: true },
    { device: 'Safari / macOS', ip: '10.0.0.1', lastActive: '2 hours ago', current: false },
    { device: 'Mobile App / iOS', ip: '172.16.0.1', lastActive: '1 day ago', current: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">User Details</h1>
          <Breadcrumb />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 text-center">
          <Avatar name="John Doe" size="xl" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{mockUser.firstName} {mockUser.lastName}</h2>
          <p className="text-sm text-neutral-500 mb-3">@{mockUser.username}</p>
          <Badge variant="primary">{mockUser.role.replace('_', ' ')}</Badge>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
          <div className="mt-6 space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Mail className="h-4 w-4" />
              {mockUser.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Calendar className="h-4 w-4" />
              Joined {new Date(mockUser.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Clock className="h-4 w-4" />
              Last login: {new Date(mockUser.lastLogin).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Shield className="h-4 w-4" />
              MFA: {mockUser.isMFAEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Activity Log</h3>
          <Timeline items={activityTimeline} />
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{session.device}</p>
                  <p className="text-xs text-neutral-400">IP: {session.ip}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">{session.lastActive}</span>
                {session.current ? (
                  <Badge variant="success" size="sm">Current</Badge>
                ) : (
                  <Button variant="ghost" size="sm" className="text-red-500">Revoke</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
