import { toast } from 'react-hot-toast';

// Universal toast utility with close buttons for ALL toasts
const universalToast = {
  success: (message, options = {}) => {
    return toast.success(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <span style={{ flex: 1 }}>{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              flexShrink: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: '1',
              padding: 0,
              transition: 'background 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ),
      options
    );
  },

  error: (message, options = {}) => {
    return toast.error(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <span style={{ flex: 1 }}>{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              flexShrink: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: '1',
              padding: 0,
              transition: 'background 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ),
      options
    );
  },

  // Default toast (for info messages)
  show: (message, options = {}) => {
    return toast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <span style={{ flex: 1 }}>{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              flexShrink: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: '1',
              padding: 0,
              transition: 'background 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ),
      options
    );
  },

  info: (message, options = {}) => {
    return toast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <span style={{ flex: 1 }}>{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              flexShrink: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: '1',
              padding: 0,
              transition: 'background 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ),
      options
    );
  },
};

export default universalToast;
