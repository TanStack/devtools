import type { ConsoleLevel } from './plugin'

export const VIRTUAL_MODULE_ID = 'virtual:tanstack-devtools-console'
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

/**
 * Generates inline code to inject into entry files.
 * This code runs on the CLIENT and will:
 * 1. Store original console methods
 * 2. Create batched wrappers that POST to server via fetch
 * 3. Override global console with the wrapped methods
 * 4. Listen for server console logs via SSE
 *
 * Returns the inline code as a string - no imports needed since we use fetch.
 */
export function generateConsolePipeCode(levels: Array<ConsoleLevel>): string {
  const levelsArray = JSON.stringify(levels)

  return `
;(function __tsdConsolePipe() {
  if (typeof window === 'undefined') return; // Only run on client
  if (window.__TSD_CONSOLE_PIPE_INITIALIZED__) return; // Only run once
  window.__TSD_CONSOLE_PIPE_INITIALIZED__ = true;

  const CONSOLE_LEVELS = ${levelsArray};

  console.log('[TSD Console Pipe] Initializing, levels:', CONSOLE_LEVELS);

  // Store original console methods before we override them
  const originalConsole = {};
  for (const level of CONSOLE_LEVELS) {
    originalConsole[level] = console[level].bind(console);
  }

  // Simple inline batcher implementation
  let batchedEntries = [];
  let batchTimeout = null;
  const BATCH_WAIT = 100;
  const BATCH_MAX_SIZE = 50;

  function flushBatch() {
    if (batchedEntries.length === 0) return;
    
    const entries = batchedEntries;
    batchedEntries = [];
    batchTimeout = null;
    
    originalConsole.log('[TSD Console Pipe] Sending', entries.length, 'entries to server');
    
    // Send to server via fetch
    fetch('/__tsd/console-pipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    }).catch((err) => {
      originalConsole.error('[TSD Console Pipe] Failed to send logs:', err);
    });
  }

  function addToBatch(entry) {
    batchedEntries.push(entry);
    
    if (batchedEntries.length >= BATCH_MAX_SIZE) {
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }
      flushBatch();
    } else if (!batchTimeout) {
      batchTimeout = setTimeout(flushBatch, BATCH_WAIT);
    }
  }

  // Override global console methods
  for (const level of CONSOLE_LEVELS) {
    const original = originalConsole[level];
    console[level] = function(...args) {
      const entry = {
        level,
        args,
        source: 'client',
        timestamp: Date.now(),
      };
      addToBatch(entry);
      original.apply(console, args);
    };
  }

  originalConsole.log('[TSD Console Pipe] Console methods overridden');

  // Listen for server console logs via SSE
  const eventSource = new EventSource('/__tsd/console-pipe/sse');
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.entries) {
        for (const entry of data.entries) {
          const prefix = '%c[Server]%c';
          const prefixStyle = 'color: #9333ea; font-weight: bold;';
          const resetStyle = 'color: inherit;';
          const logMethod = originalConsole[entry.level] || originalConsole.log;
          logMethod(prefix, prefixStyle, resetStyle, ...entry.args);
        }
      }
    } catch (err) {
      originalConsole.error('[TSD Console Pipe] Failed to parse SSE data:', err);
    }
  };

  eventSource.onerror = () => {
    originalConsole.log('[TSD Console Pipe] SSE connection error, will retry...');
  };

  originalConsole.log('[TSD Console Pipe] SSE listener connected');

  // Flush on page unload
  window.addEventListener('beforeunload', flushBatch);
})();
`
}
