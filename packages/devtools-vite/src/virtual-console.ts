import type { ConsoleLevel } from './plugin'

// export const VIRTUAL_MODULE_ID = 'virtual:tanstack-devtools-console'
// export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

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
    }).catch(function( ) {
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

  var MAX_DEPTH = 6;
  var MAX_ARRAY_LEN = 100;
  var MAX_OBJECT_KEYS = 100;
  var MAX_STRING_LENGTH = 10000;

  function truncateString(value) {
    if (value.length <= MAX_STRING_LENGTH) return value;
    return value.slice(0, MAX_STRING_LENGTH) + '... (' + (value.length - MAX_STRING_LENGTH) + ' more chars)';
  }

  function formatDomElement(element) {
    var tagName = element.tagName ? element.tagName.toLowerCase() : 'element';
    var output = '<' + tagName;
    var attrs = ['id', 'class', 'name', 'type', 'role', 'aria-label', 'data-testid'];

    for (var attrIndex = 0; attrIndex < attrs.length; attrIndex++) {
      var attrName = attrs[attrIndex];
      var attrValue = element.getAttribute && element.getAttribute(attrName);
      if (attrValue) {
        output += ' ' + attrName + '="' + truncateString(String(attrValue)).replace(/"/g, '&quot;') + '"';
      }
    }

    return output + '>';
  }

  function getObjectTypeName(arg) {
    return arg && arg.constructor && arg.constructor.name ? arg.constructor.name : 'Object';
  }

  function formatArrayBufferView(arg) {
    var length = typeof arg.length === 'number' ? arg.length : arg.byteLength;
    return '[' + getObjectTypeName(arg) + '(' + length + ')]';
  }

  function serializeConsoleArg(arg, seen, depth) {
    if (depth === undefined) depth = 0;
    if (arg === undefined) return 'undefined';
    if (arg === null) return null;

    var argType = typeof arg;

    if (argType === 'function') return '[Function' + (arg.name ? ': ' + arg.name : '') + ']';
    if (argType === 'symbol') return arg.toString();
    if (argType === 'bigint') return arg.toString() + 'n';
    if (argType === 'string') return truncateString(arg);
    if (argType !== 'object') return arg;

    if (!isServer) {
      if (
        arg.nodeType === 1 &&
        typeof arg.tagName === 'string' &&
        typeof arg.getAttribute === 'function'
      ) {
        return formatDomElement(arg);
      }
      if (arg.nodeType === 9) {
        return '[Document]';
      }
      if (typeof Window !== 'undefined' && arg instanceof Window) {
        return '[Window]';
      }
      if (typeof Event !== 'undefined' && arg instanceof Event) {
        return {
          type: arg.type,
          target: serializeConsoleArg(arg.target, seen, depth + 1),
          currentTarget: serializeConsoleArg(arg.currentTarget, seen, depth + 1),
          defaultPrevented: arg.defaultPrevented,
        };
      }
      if (typeof Node !== 'undefined' && arg instanceof Node) {
        return '[Node: ' + arg.nodeName + ']';
      }
    }

    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: truncateString(arg.message),
        stack: arg.stack ? truncateString(arg.stack) : arg.stack,
      };
    }

    if (arg instanceof Date) {
      return arg.toISOString();
    }

    if (arg instanceof RegExp) {
      return arg.toString();
    }

    if (typeof ArrayBuffer !== 'undefined') {
      if (ArrayBuffer.isView && ArrayBuffer.isView(arg)) {
        return formatArrayBufferView(arg);
      }
      if (arg instanceof ArrayBuffer) {
        return '[ArrayBuffer(' + arg.byteLength + ')]';
      }
    }

    if (typeof SharedArrayBuffer !== 'undefined' && arg instanceof SharedArrayBuffer) {
      return '[SharedArrayBuffer(' + arg.byteLength + ')]';
    }

    if (depth >= MAX_DEPTH) {
      return '[MaxDepth]';
    }

    if (seen.indexOf(arg) !== -1) {
      return '[Circular]';
    }

    seen.push(arg);

    if (Array.isArray(arg)) {
      var arrayResult = [];
      var arrayLength = Math.min(arg.length, MAX_ARRAY_LEN);
      for (var arrayIndex = 0; arrayIndex < arrayLength; arrayIndex++) {
        arrayResult.push(serializeConsoleArg(arg[arrayIndex], seen, depth + 1));
      }
      if (arg.length > MAX_ARRAY_LEN) {
        arrayResult.push('... (' + (arg.length - MAX_ARRAY_LEN) + ' more)');
      }
      seen.pop();
      return arrayResult;
    }

    var objectResult = {};
    var keys = Object.keys(arg);
    var keyLength = Math.min(keys.length, MAX_OBJECT_KEYS);
    for (var keyIndex = 0; keyIndex < keyLength; keyIndex++) {
      var key = keys[keyIndex];
      try {
        objectResult[key] = serializeConsoleArg(arg[key], seen, depth + 1);
      } catch (error) {
        objectResult[key] = '[Thrown: ' + String(error) + ']';
      }
    }
    if (keys.length > MAX_OBJECT_KEYS) {
      objectResult['...'] = '(' + (keys.length - MAX_OBJECT_KEYS) + ' more keys)';
    }
    seen.pop();
    return objectResult;
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

        var safeArgs = args.map(function(arg) {
          try {
            return serializeConsoleArg(arg, [], 0);
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
    function transformServerLogArgs(args, preserveEmptyStrings) {
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
          
          if (preserveEmptyStrings || cleaned.trim()) {
            transformed.push(cleaned);
          }
        } else {
          transformed.push(arg);
        }
      }
      
      return transformed;
    }

    function hasConsoleFormatSubstitution(arg) {
      return typeof arg === 'string' && /(^|[^%])%[sdifocOj]/.test(arg);
    }

    function isEnhancedLogPrefix(arg) {
      return typeof arg === 'string' &&
        arg.indexOf('LOG') !== -1 &&
        arg.indexOf(String.fromCharCode(10) + ' ' + String.fromCharCode(8594) + ' ') !== -1;
    }

    function getConsoleFormatIndex(args) {
      if (hasConsoleFormatSubstitution(args[0])) return 0;
      return isEnhancedLogPrefix(args[0]) && hasConsoleFormatSubstitution(args[1]) ? 1 : -1;
    }

    var eventSource = new EventSource('/__tsd/console-pipe/sse');
    
    eventSource.onmessage = function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.entries) {
          for (var m = 0; m < data.entries.length; m++) {
            var entry = data.entries[m];
            var formatIndex = getConsoleFormatIndex(entry.args);
            var shouldPreserveFormat = formatIndex !== -1;
            var transformedArgs = transformServerLogArgs(entry.args, shouldPreserveFormat);
            var prefix = '%c[Server]%c';
            var prefixStyle = 'color: #9333ea; font-weight: bold;';
            var resetStyle = 'color: inherit;';
            var logMethod = originalConsole[entry.level] || originalConsole.log;
            if (shouldPreserveFormat) {
              logMethod.apply(
                console,
                [prefix + ' ' + transformedArgs.slice(0, formatIndex + 1).join(''), prefixStyle, resetStyle].concat(transformedArgs.slice(formatIndex + 1))
              );
            } else {
              logMethod.apply(console, [prefix, prefixStyle, resetStyle].concat(transformedArgs));
            }
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
