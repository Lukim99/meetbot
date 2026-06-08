import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto bg-[--color-surface] border border-[--color-border] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h2 className="text-base font-medium text-[--color-text]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[--color-text-muted] hover:text-[--color-text] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[--color-border] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
