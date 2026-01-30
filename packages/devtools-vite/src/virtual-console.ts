export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

export const VIRTUAL_MODULE_ID = 'virtual:tanstack-devtools-console'
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

/**
 * Generates inline code to inject into entry files (both client and server).
 * This code detects the environment at runtime and:
 *
 * CLIENT:
 * 1. Store original console methods
 * 2. Create batched wrappers that POST to server via fetch
 * 3. Override global console with the wrapped methods
 * 4. Listen for server console logs via SSE
 *
 * SERVER (Nitro/Vinxi runtime):
 * 1. Store original console methods
 * 2. Create batched wrappers that POST to Vite dev server
 * 3. Override global console - original logging still happens, just also pipes to Vite
 *
 * Returns the inline code as a string - no imports needed since we use fetch.
 */
export function generateConsolePipeCode(
  levels: Array<ConsoleLevel>,
  viteServerUrl: string,
): string {
  const levelsArray = JSON.stringify(levels)

  return `
;(function __tsdConsolePipe() {
  // Detect environment
  var isServer = typeof window === 'undefined';
  var envKey = isServer ? '__TSD_SERVER_CONSOLE_PIPE_INITIALIZED__' : '__TSD_CONSOLE_PIPE_INITIALIZED__';
  var globalObj = isServer ? globalThis : window;
  
  // Only run once per environment
  if (globalObj[envKey]) return;
  globalObj[envKey] = true;

  var CONSOLE_LEVELS = ${levelsArray};
  var VITE_SERVER_URL = ${JSON.stringify(viteServerUrl)};

  // Store original console methods before we override them
  var originalConsole = {};
  for (var i = 0; i < CONSOLE_LEVELS.length; i++) {
    var level = CONSOLE_LEVELS[i];
    originalConsole[level] = console[level].bind(console);
  }

  // Simple inline batcher implementation
  var batchedEntries = [];
  var batchTimeout = null;
  var BATCH_WAIT = isServer ? 50 : 100;
  var BATCH_MAX_SIZE = isServer ? 20 : 50;

  function flushBatch() {
    if (batchedEntries.length === 0) return;
    
    var entries = batchedEntries;
    batchedEntries = [];
    batchTimeout = null;
    
    // Determine endpoint based on environment
    var endpoint = isServer 
      ? VITE_SERVER_URL + '/__tsd/console-pipe/server'
      : '/__tsd/console-pipe';
    
    // Send to Vite server via fetch
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: entries }),
    }).catch(function() {
      // Swallow errors  
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
  for (var j = 0; j < CONSOLE_LEVELS.length; j++) {
    (function(level) {
      var original = originalConsole[level];
      console[level] = function() {
        var args = Array.prototype.slice.call(arguments);
        
        // Always call original first so logs appear normally
        original.apply(console, args);
        
        // Skip our own TSD Console Pipe logs to avoid recursion/noise
        if (args.length > 0 && typeof args[0] === 'string' && 
            (args[0].indexOf('[TSD Console Pipe]') !== -1 || 
             args[0].indexOf('[@tanstack/devtools') !== -1)) {
          return;
        }

        // Serialize args safely
        var safeArgs = args.map(function(arg) {
          if (arg === undefined) return 'undefined';
          if (arg === null) return null;
          if (typeof arg === 'function') return '[Function]';
          if (typeof arg === 'symbol') return arg.toString();
          try {
            JSON.stringify(arg);
            return arg;
          } catch (e) {
            return String(arg);
          }
        });

        var entry = {
          level: level,
          args: safeArgs,
          source: isServer ? 'server' : 'client',
          timestamp: Date.now(),
        };
        
        addToBatch(entry);
      };
    })(CONSOLE_LEVELS[j]);
  }

  // CLIENT ONLY: Listen for server console logs via SSE
  if (!isServer) {
    // Transform server log args - strip ANSI codes and convert source paths to clickable URLs
    function transformServerLogArgs(args) {
      var escChar = String.fromCharCode(27);
      var transformed = [];
      
      for (var k = 0; k < args.length; k++) {
        var arg = args[k];
        if (typeof arg === 'string') {
          // Strip ANSI escape sequences (ESC[...m patterns)
          var cleaned = arg;
          // Remove ESC character followed by [...m] - need to build regex dynamically
          while (cleaned.indexOf(escChar) !== -1) {
            cleaned = cleaned.split(escChar).join('');
          }
          // Also remove any leftover bracket codes like [35m
          cleaned = cleaned.replace(/\\[[0-9;]*m/g, '');
          
          // Transform source paths to clickable URLs
          // Match patterns like /src/components/Header.tsx:17:3
          var sourceRegex = /(\\/[^\\s]+:\\d+:\\d+)/g;
          cleaned = cleaned.replace(sourceRegex, function(match) {
            return window.location.origin + '/__tsd/open-source?source=' + encodeURIComponent(match);
          });
          
          if (cleaned.trim()) {
            transformed.push(cleaned);
          }
        } else {
          transformed.push(arg);
        }
      }
      
      return transformed;
    }

    var eventSource = new EventSource('/__tsd/console-pipe/sse');
    
    eventSource.onmessage = function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.entries) {
          for (var m = 0; m < data.entries.length; m++) {
            var entry = data.entries[m];
            var transformedArgs = transformServerLogArgs(entry.args);
            var prefix = '%c[Server]%c';
            var prefixStyle = 'color: #9333ea; font-weight: bold;';
            var resetStyle = 'color: inherit;';
            var logMethod = originalConsole[entry.level] || originalConsole.log;
            logMethod.apply(console, [prefix, prefixStyle, resetStyle].concat(transformedArgs));
          }
        }
      } catch (err) {
         // Swallow errors
      }
    };

    eventSource.onerror = function() {
       // Swallow errors
    };

    // Flush on page unload
    window.addEventListener('beforeunload', flushBatch);
  }
})();
`
}
