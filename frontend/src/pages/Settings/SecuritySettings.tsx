import { useState } from 'react';
import { GlassCard } from '@/components/UI/GlassCard';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Toggle } from '@/components/UI/Toggle';
import { Badge } from '@/components/UI/Badge';
import { MFASetup } from '@/components/Auth/MFASetup';

export function SecuritySettings() {
  const [showMFA, setShowMFA] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Password</h3>
        <div className="space-y-4">
          <Input label="Current Password" type="password" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="New Password" type="password" />
            <Input label="Confirm Password" type="password" />
          </div>
          <Button variant="primary">Update Password</Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-neutral-500">Add an extra layer of security to your account</p>
          </div>
          <Badge variant={mfaEnabled ? 'success' : 'default'}>{mfaEnabled ? 'Enabled' : 'Disabled'}</Badge>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">Authenticator App</p>
            <p className="text-sm text-neutral-500">Use Google Authenticator or Authy</p>
          </div>
          <Button
            variant={mfaEnabled ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => {
              if (mfaEnabled) {
                setMfaEnabled(false);
              } else {
                setShowMFA(true);
              }
            }}
          >
            {mfaEnabled ? 'Disable' : 'Setup'}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {[
            { device: 'Chrome on Windows', ip: '192.168.1.1', current: true, lastActive: 'Active now' },
            { device: 'Safari on macOS', ip: '10.0.0.1', current: false, lastActive: '2 hours ago' },
          ].map((session, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-neutral-900 dark:text-white">{session.device}</p>
                  {session.current && <Badge variant="success" size="sm">Current</Badge>}
                </div>
                <p className="text-xs text-neutral-400">IP: {session.ip} • {session.lastActive}</p>
              </div>
              {!session.current && <Button variant="ghost" size="sm" className="text-red-500">Revoke</Button>}
            </div>
          ))}
        </div>
      </GlassCard>

      <MFASetup isOpen={showMFA} onClose={() => { setShowMFA(false); setMfaEnabled(true); }} />
    </div>
  );
}
