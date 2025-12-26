// consoleSilencer.js
// Temporarily silence selected console methods; returns a restore function.
// Usage:
//   const restore = silenceConsole(['log','debug','info']);
//   ...do noisy work...
//   restore();

export function silenceConsole(levels = ['log']) {
  if (typeof window === 'undefined' || !window.console) {
    return () => {};
  }
  const methods = Array.isArray(levels) ? levels : ['log'];
  const original = {};
  methods.forEach((m) => {
    if (typeof console[m] === 'function') {
      original[m] = console[m];
      console[m] = () => {};
    }
  });

  let restored = false;
  return function restore() {
    if (restored) return;
    restored = true;
    Object.keys(original).forEach((m) => {
      console[m] = original[m];
    });
  };
}

export default silenceConsole;
