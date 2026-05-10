import { toast } from 'react-hot-toast'

const DEFAULT_DURATIONS = {
  success: 3000,
  error: 4000,
  info: 3000,
  show: 3000,
  loading: Infinity,
}

const normalizeMessage = (msg) => String(msg || '').trim().replace(/\s+/g, ' ')

const buildToastId = (variant, message, explicitId) => {
  if (explicitId) return explicitId
  const base = normalizeMessage(message)
  return `${variant}|${base}`.slice(0, 180)
}

const universalToast = {
  success: (message, options = {}) => toast.success(message, {
    id: buildToastId('success', message, options.id),
    duration: options.duration || DEFAULT_DURATIONS.success,
    ...options,
  }),
  error: (message, options = {}) => toast.error(message, {
    id: buildToastId('error', message, options.id),
    duration: options.duration || DEFAULT_DURATIONS.error,
    ...options,
  }),
  info: (message, options = {}) => toast(message, {
    id: buildToastId('info', message, options.id),
    duration: options.duration || DEFAULT_DURATIONS.info,
    ...options,
  }),
  loading: (message, options = {}) => toast.loading(message, {
    id: buildToastId('loading', message, options.id),
    duration: options.duration || DEFAULT_DURATIONS.loading,
    ...options,
  }),
  dismiss: (id) => toast.dismiss(id),
}

export default universalToast
