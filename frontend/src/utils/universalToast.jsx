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

// Helper to render modern SaaS-style toast with circular timer
const renderContent = (message, t, durationMs, iconColor = '#22c55e', iconBg = '#dcfce7', mainColor = '#22c55e') => {
  // Auto-dismiss when progress bar completes
  if (Number.isFinite(durationMs) && durationMs > 0) {
    setTimeout(() => {
      toast.dismiss(t.id);
    }, durationMs);
  }

  // Get the appropriate icon based on color
  const getIcon = () => {
    if (iconColor === '#22c55e') { // Success
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: iconColor, width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
    } else if (iconColor === '#ef4444') { // Error
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: iconColor, width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    } else { // Info/Default
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: iconColor, width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#ffffff',
      color: '#111827',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
      minWidth: '320px',
      maxWidth: '500px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Inline keyframes for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes circularTimer {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 63; }
        }
      `}</style>

      {/* Icon container */}
      <div style={{ 
        flexShrink: 0,
        backgroundColor: iconBg,
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {getIcon()}
      </div>
      
      {/* Message content */}
      <span style={{ 
        flex: 1,
        fontSize: '14px', 
        fontWeight: '500',
        lineHeight: '1.4',
        color: '#111827'
      }}>
        {message}
      </span>
      
      {/* Close button with circular timer */}
      <button 
        onClick={() => toast.dismiss(t.id)}
        style={{
          marginLeft: 'auto',
          position: 'relative',
          width: '24px',
          height: '24px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label="Close notification"
      >
        {/* Close X icon */}
        <svg 
          style={{ 
            position: 'absolute',
            margin: 'auto',
            width: '16px',
            height: '16px',
            color: '#9ca3af'
          }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        
        {/* Circular timer progress */}
        {Number.isFinite(durationMs) && durationMs > 0 && (
          <svg style={{ position: 'absolute', width: '24px', height: '24px', transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke={`${mainColor}30`} 
              strokeWidth="2.5" 
              fill="none" 
            />
            {/* Progress circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={mainColor}
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="63"
              strokeDashoffset="0"
              strokeLinecap="round"
              style={{
                animation: `circularTimer ${durationMs}ms linear forwards`
              }}
            />
          </svg>
        )}
      </button>
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
        '#22c55e', // iconColor
        '#dcfce7', // iconBg (green-100)
        '#22c55e'  // mainColor
      ), 
      {
        ...computed,
        icon: false, // Disable default react-hot-toast icon
      }
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
        '#ef4444', // iconColor
        '#fecaca', // iconBg (red-200)
        '#ef4444'  // mainColor
      ), 
      {
        ...computed,
        icon: false, // Disable default react-hot-toast icon
      }
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
        '#3b82f6', // iconColor
        '#dbeafe', // iconBg (blue-100)
        '#3b82f6'  // mainColor
      ), 
      {
        ...computed,
        icon: false, // Disable default react-hot-toast icon
      }
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
        '#3b82f6', // iconColor
        '#dbeafe', // iconBg (blue-100)
        '#3b82f6'  // mainColor
      ), 
      {
        ...computed,
        icon: false, // Disable default react-hot-toast icon
      }
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
