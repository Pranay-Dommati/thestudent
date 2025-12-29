import { useEffect, useRef, useCallback } from 'react';
import universalToast from '../utils/universalToast';

/**
 * Hook to auto-save form data to localStorage and restore it on mount.
 * 
 * @param {string} key - Unique key for localStorage
 * @param {any} data - The data object to save
 * @param {function} onRestore - Callback function to restore data. Receives the parsed data.
 * @param {boolean} shouldSave - Boolean to control if saving should be active (e.g. only after initial load)
 * @returns {object} - { clearSavedData }
 */
const useAutoSave = (key, data, onRestore, shouldSave = true) => {
  const isRestored = useRef(false);
  const lastSavedData = useRef(null);

  // Load saved data on mount
  useEffect(() => {
    if (isRestored.current) return;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Check if we have valid data to restore
        if (parsed && Object.keys(parsed).length > 0) {
            if (onRestore) {
                console.log(`[AutoSave] Restoring data for ${key}`);
                onRestore(parsed);
                universalToast.info('Restored unsaved changes from your last session.');
            }
        }
      }
    } catch (e) {
      console.error('[AutoSave] Error restoring data', e);
    }
    isRestored.current = true;
  }, [key]); // Intentionally omitted onRestore to avoid re-running if callback changes

  // Save data on change (debounced)
  useEffect(() => {
    if (!isRestored.current || !shouldSave) return;

    const handler = setTimeout(() => {
        const stringified = JSON.stringify(data);
        
        // Avoid saving if identical to last save
        if (lastSavedData.current === stringified) return;

        try {
            localStorage.setItem(key, stringified);
            lastSavedData.current = stringified;
        } catch (e) {
            console.error('[AutoSave] Error saving data', e);
        }
    }, 2000); // 2 second debounce to be less aggressive

    return () => clearTimeout(handler);
  }, [key, data, shouldSave]);

  const clearSavedData = useCallback(() => {
    try {
        console.log(`[AutoSave] Clearing data for ${key}`);
        localStorage.removeItem(key);
        lastSavedData.current = null;
    } catch (e) {
        console.error('[AutoSave] Error clearing data', e);
    }
  }, [key]);

  return { clearSavedData };
};

export default useAutoSave;
