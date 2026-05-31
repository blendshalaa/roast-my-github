import { AlertTriangle, XCircle } from 'lucide-react'

export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="glass-card p-4 sm:p-5 border-red-500/30 bg-red-500/5 animate-slide-up flex items-start gap-3"
    >
      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-300">Something went wrong</p>
        <p className="text-sm text-red-400/80 mt-0.5 break-words">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
