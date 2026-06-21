import { useState } from 'react';
import { Shield, Copy, Check } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';

interface MFASetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MFASetup({ isOpen, onClose }: MFASetupProps) {
  const [step, setStep] = useState<'qr' | 'verify' | 'done'>('qr');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const secretKey = 'JBSWY3DPEHPK3PXP';
  const otpUrl = `otpauth://totp/Enterprise:Dashboard?secret=${secretKey}&issuer=Enterprise`;

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (code.length === 6) {
      setStep('done');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Up Two-Factor Authentication" size="md">
      {step === 'qr' && (
        <div className="space-y-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-2xl bg-white p-4 shadow-inner">
              <img
                src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpUrl)}`}
                alt="QR Code"
                className="w-full h-full"
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-100 dark:bg-dark-800">
            <p className="text-xs text-neutral-500 mb-2">Or enter this key manually:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white dark:bg-dark-900 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
                {secretKey}
              </code>
              <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-dark-700">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-neutral-400" />}
              </button>
            </div>
          </div>
          <Button variant="primary" className="w-full" onClick={() => setStep('verify')}>
            I've scanned the code
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/10">
            <Shield className="h-6 w-6 text-primary-500" />
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Enter the 6-digit code from your authenticator app to verify setup.
            </p>
          </div>
          <Input
            label="Verification Code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
          <Button variant="primary" className="w-full" onClick={handleVerify} disabled={code.length !== 6}>
            Verify & Activate
          </Button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">MFA Enabled</h3>
          <p className="text-sm text-neutral-500">
            Two-factor authentication has been successfully enabled for your account.
          </p>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
