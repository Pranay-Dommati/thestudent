import { toast } from 'react-hot-toast';

// Custom toast wrapper with close button
const customToast = {
  success: (message, options = {}) => {
    return toast.success(
      (t) => (
        <div className="flex items-center justify-between w-full gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 ml-2 text-white hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ),
      {
        ...options,
        style: {
          ...options.style,
          maxWidth: '500px',
        },
      }
    );
  },

  error: (message, options = {}) => {
    return toast.error(
      (t) => (
        <div className="flex items-center justify-between w-full gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 ml-2 text-white hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ),
      {
        ...options,
        style: {
          ...options.style,
          maxWidth: '500px',
        },
      }
    );
  },

  info: (message, options = {}) => {
    return toast(
      (t) => (
        <div className="flex items-center justify-between w-full gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 ml-2 text-white hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ),
      {
        ...options,
        style: {
          ...options.style,
          maxWidth: '500px',
        },
      }
    );
  },
};

export default customToast;
