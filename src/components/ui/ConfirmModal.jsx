// `confirmLabel` and `destructive` default to the delete case this started as,
// so every existing caller renders exactly as before. They exist because the
// bulk fill on the Discovery screen also needs a confirm step, and a red button
// reading "Delete" in front of an action that only fills blanks is a lie.
export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  destructive = true,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="font-heading font-bold text-lg text-dark">{title}</h3>
        <p className="text-gray-600 text-sm mt-2">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-dark rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
              destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
