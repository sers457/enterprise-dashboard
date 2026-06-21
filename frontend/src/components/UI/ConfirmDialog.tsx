import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variants = {
    danger: { icon: 'text-red-500', button: 'danger' as const },
    warning: { icon: 'text-amber-500', button: 'primary' as const },
    info: { icon: 'text-sky-500', button: 'primary' as const },
  };

  const v = variants[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-4">
        <div className={`w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-dark-800 flex items-center justify-center mx-auto mb-4 ${v.icon}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
      </div>
      <div className="flex items-center gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={v.button} onClick={onConfirm} className="flex-1" isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
