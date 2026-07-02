import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="mb-6 text-sm text-muted-foreground">{description}</p>}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
