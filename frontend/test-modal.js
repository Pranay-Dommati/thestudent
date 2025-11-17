// Quick test to debug modal visibility
console.log('=== MODAL DEBUG TEST ===');
console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight);
console.log('User agent:', navigator.userAgent);
console.log('Document body overflow:', getComputedStyle(document.body).overflow);
console.log('Document body position:', getComputedStyle(document.body).position);
console.log('LocalStorage pendingFreemiumCourse:', localStorage.getItem('pendingFreemiumCourse'));
console.log('LocalStorage freemiumLoginInProgress:', localStorage.getItem('freemiumLoginInProgress'));

// Check if modal exists in DOM
const modals = document.querySelectorAll('[class*="inset-0"], [class*="fixed"], [class*="z-[9999]"]');
console.log('Found', modals.length, 'potential modals in DOM');
modals.forEach((modal, i) => {
  const styles = getComputedStyle(modal);
  console.log(`Modal ${i}:`, {
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity,
    zIndex: styles.zIndex,
    position: styles.position,
    transform: styles.transform
  });
});