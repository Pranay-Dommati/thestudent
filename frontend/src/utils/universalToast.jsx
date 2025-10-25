import { toast } from 'react-hot-toast';

// Universal toast utility with close buttons for ALL toasts
// Default durations aligned with App.jsx Toaster config
const DEFAULT_DURATIONS = {
  success: 3000,
  error: 4000,
  info: 3000,
  show: 3000,
  loading: Infinity,
};

// Internal registry for optional debounce/diagnostics (not strictly required for dedupe via id)
const activeToasts = new Set();

// Normalize a message so identical texts map to the same id across mobile/desktop
const normalizeMessage = (msg) => String(msg || '')
  .trim()
  .replace(/\s+/g, ' '); // collapse whitespace

// Build a deterministic toast id so the same message/type can’t stack duplicates
const buildToastId = (variant, message, explicitId, dedupeKey) => {
  if (explicitId) return explicitId; // caller-provided id has priority
  if (dedupeKey) return `key:${dedupeKey}`;
  const base = normalizeMessage(message);
  // Use variant + normalized message as stable id
  return `${variant}|${base}`.slice(0, 180); // keep id reasonably short
};

// Helper to render content with a bottom progress bar timer
const renderContent = (message, t, durationMs, barGradient = 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)', barShadow = '0 0 8px rgba(255, 255, 255, 0.6)') => {
  // Auto-dismiss when progress bar completes
  if (Number.isFinite(durationMs) && durationMs > 0) {
    setTimeout(() => {
      toast.dismiss(t.id);
    }, durationMs);
  }

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Inline keyframes so no external CSS needed */}
      <style>{`
        @keyframes toastProgressShrink { 
          from { transform: scaleX(1); } 
          to { transform: scaleX(0); } 
        }
      `}</style>
      
      {/* Message and close button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px' }}>
        <span style={{ flex: 1, fontSize: '15px', lineHeight: '1.5', fontWeight: '500' }}>{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{
            flexShrink: 0,
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: '600',
            lineHeight: '1',
            padding: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Bottom progress bar (hidden for infinite/indeterminate durations) */}
      {Number.isFinite(durationMs) && durationMs > 0 && (
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '2px',
          }}
          aria-hidden
        >
          <div
            style={{
              height: '100%',
              width: '100%',
              background: barGradient,
              boxShadow: barShadow,
              borderRadius: '2px',
              animation: `toastProgressShrink ${durationMs}ms linear forwards`,
              transformOrigin: 'right',
            }}
          />
        </div>
      )}
    </div>
  );
};

const universalToast = {
  // Success toast (deduped by default)
  success: (message, options = {}) => {
    const duration = options?.duration ?? DEFAULT_DURATIONS.success;
    const id = buildToastId('success', message, options?.id, options?.dedupeKey);
    const onClosePrev = options?.onClose;
    const computed = {
      ...options,
      id,
      duration: Infinity, // Disable auto-dismiss, let our progress bar control it
      onClose: (t) => {
        activeToasts.delete(id);
        onClosePrev?.(t);
      },
    };
    activeToasts.add(id);
    return toast.success(
      (t) => renderContent(
        message, 
        t, 
        duration, 
        'linear-gradient(90deg, rgba(72, 187, 120, 0.95) 0%, rgba(34, 197, 94, 1) 100%)',
        '0 0 10px rgba(34, 197, 94, 0.7), 0 0 20px rgba(34, 197, 94, 0.4)'
      ), 
      computed
    );
  },

  // Error toast (deduped by default)
  error: (message, options = {}) => {
    const duration = options?.duration ?? DEFAULT_DURATIONS.error;
    const id = buildToastId('error', message, options?.id, options?.dedupeKey);
    const onClosePrev = options?.onClose;
    const computed = {
      ...options,
      id,
      duration: Infinity, // Disable auto-dismiss, let our progress bar control it
      onClose: (t) => {
        activeToasts.delete(id);
        onClosePrev?.(t);
      },
    };
    activeToasts.add(id);
    return toast.error(
      (t) => renderContent(
        message, 
        t, 
        duration, 
        'linear-gradient(90deg, rgba(248, 113, 113, 0.95) 0%, rgba(239, 68, 68, 1) 100%)',
        '0 0 10px rgba(239, 68, 68, 0.7), 0 0 20px rgba(239, 68, 68, 0.4)'
      ), 
      computed
    );
  },

  // Default toast (for info messages)
  show: (message, options = {}) => {
    const duration = options?.duration ?? DEFAULT_DURATIONS.show;
    const id = buildToastId('show', message, options?.id, options?.dedupeKey);
    const onClosePrev = options?.onClose;
    const computed = {
      ...options,
      id,
      duration: Infinity, // Disable auto-dismiss, let our progress bar control it
      onClose: (t) => {
        activeToasts.delete(id);
        onClosePrev?.(t);
      },
    };
    activeToasts.add(id);
    return toast(
      (t) => renderContent(
        message, 
        t, 
        duration, 
        'linear-gradient(90deg, rgba(147, 197, 253, 0.95) 0%, rgba(96, 165, 250, 1) 100%)',
        '0 0 10px rgba(96, 165, 250, 0.7), 0 0 20px rgba(96, 165, 250, 0.4)'
      ), 
      computed
    );
  },

  // Info toast (alias of show with same theming; kept for API parity)
  info: (message, options = {}) => {
    const duration = options?.duration ?? DEFAULT_DURATIONS.info;
    const id = buildToastId('info', message, options?.id, options?.dedupeKey);
    const onClosePrev = options?.onClose;
    const computed = {
      ...options,
      id,
      duration: Infinity, // Disable auto-dismiss, let our progress bar control it
      onClose: (t) => {
        activeToasts.delete(id);
        onClosePrev?.(t);
      },
    };
    activeToasts.add(id);
    return toast(
      (t) => renderContent(
        message, 
        t, 
        duration, 
        'linear-gradient(90deg, rgba(147, 197, 253, 0.95) 0%, rgba(96, 165, 250, 1) 100%)',
        '0 0 10px rgba(96, 165, 250, 0.7), 0 0 20px rgba(96, 165, 250, 0.4)'
      ), 
      computed
    );
  },

  // Loading toast (persisting until dismissed or updated)
  loading: (message, options = {}) => {
    const duration = options?.duration ?? DEFAULT_DURATIONS.loading;
    const id = buildToastId('loading', message, options?.id, options?.dedupeKey);
    const onClosePrev = options?.onClose;
    const computed = {
      ...options,
      id,
      duration,
      onClose: (t) => {
        activeToasts.delete(id);
        onClosePrev?.(t);
      },
    };
    activeToasts.add(id);
    // No timer bar for loading (indeterminate)
    return toast.loading((t) => renderContent(message, t, duration), computed);
  },

  // Dismiss one or all toasts
  dismiss: (toastId) => toast.dismiss(toastId),
};

export default universalToast;
