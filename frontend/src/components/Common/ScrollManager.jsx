import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollManager
 * - Resets window scroll to top on route changes (PUSH/REPLACE)
 * - Supports hash anchors: scrolls to element with matching id when present
 * - Leaves back/forward (POP) scroll position to the browser when possible
 */
export default function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'PUSH' | 'REPLACE' | 'POP'

  // Prefer manual scroll restoration for SPAs
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch {}
    }
  }, []);

  useEffect(() => {
    const { pathname, search, hash } = location;

    // If there's a hash, try scroll to that element id
    const tryScrollToHash = () => {
      const id = decodeURIComponent((hash || '').replace('#', ''));
      if (!id) return false;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        return true;
      }
      return false;
    };

    // Only force scroll on fresh navigations (not browser back/forward)
    if (navigationType === 'POP') {
      // On POP, if hash exists try to honor it, otherwise let the browser keep position
      if (hash) {
        // Attempt immediately and after a tick in case content renders late
        if (!tryScrollToHash()) {
          setTimeout(tryScrollToHash, 50);
          setTimeout(tryScrollToHash, 200);
        }
      }
      return;
    }

    // For PUSH/REPLACE navigations:
    if (hash) {
      // Try hash scrolling; fall back to top if target not found quickly
      const successNow = tryScrollToHash();
      if (!successNow) {
        setTimeout(() => {
          if (!tryScrollToHash()) {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          }
        }, 100);
      }
    } else {
      // No hash: reset to top immediately
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.search, location.hash, navigationType]);

  return null;
}
