import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs rounded border border-border dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`px-3 py-1.5 text-xs rounded text-white ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accent-dark'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
