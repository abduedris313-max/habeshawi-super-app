/**
 * Tactile Haptic Vibration Feedback Helper for Mobile WebApp
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([15, 30, 15]);
          break;
      }
    } catch {
      // Ignore vibration error on unsupported hardware
    }
  }
}
