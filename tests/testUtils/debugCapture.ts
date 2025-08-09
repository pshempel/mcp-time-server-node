/**
 * Test utility for capturing debug output
 *
 * NOTE: Debug capture doesn't work with Jest due to module loading order.
 * Jest loads all modules before test setup runs, so the debug singleton
 * is created before we can override it.
 *
 * This is kept for documentation purposes and potential future migration
 * to a test runner with better module control (e.g., Vitest).
 */

// Export stub functions that document the limitation
export function captureDebugOutput(_namespace: string) {
  console.warn('Debug capture not supported with Jest - see debugCapture.ts for details');
  return {
    output: '',
    cleanup: () => {},
    getLines: () => [],
    contains: () => false,
    clear: () => {},
  };
}

export function setupDebugCapture(_namespace: string) {
  return captureDebugOutput(_namespace);
}

export function resetDebugState() {
  // No-op - kept for compatibility
}
