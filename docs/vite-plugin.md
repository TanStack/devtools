---
title: Vite Plugin
id: vite-plugin
---

The Vite Plugin for TanStack Devtools provides a seamless integration for using the devtools in your Vite-powered applications. With this plugin, you get complementary features on top of the
existing features built into the devtools like better console logs, server event bus, and enhanced debugging capabilities.

## Installation

To add the devtools vite plugin you need to install it as a development dependency:

```sh
npm install -D @tanstack/devtools-vite
```

Then add it as the *FIRST* plugin in your Vite config:

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools(),
    // ... rest of your plugins here
  ],
}
```

And you're done! 

## Configuration

You can configure the devtools plugin by passing options to the `devtools` function:

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools({
      // options here
    }),
    // ... rest of your plugins here
  ],
}
```

### eventBusConfig

  Configuration for the event bus that the devtools use to communicate with the client

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools({
      eventBusConfig: {
        // port to run the event bus on
        port: 1234,
        // console log debug logs or not
        debug: false
      }, 
    }),
    // ... rest of your plugins here
  ],
}
 
```

### editor
 
> [!IMPORTANT] `editor` is only needed for editors that are NOT VS Code, by default this works OOTB with VS Code.
 

The open in editor configuration which has two fields, `name` and `open`,
`name` is the name of your editor, and `open` is a function that opens the editor with the given file and line number. You can implement your version for your editor as follows:

 ```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools({
      editor: {
        name: 'VSCode',
        open: async (path, lineNumber, columnNumber) => {
          const { exec } = await import('node:child_process')
          exec(
            // or windsurf/cursor/webstorm
            `code -g "${(path).replaceAll('$', '\\$')}${lineNumber ? `:${lineNumber}` : ''}${columnNumber ? `:${columnNumber}` : ''}"`,
          )
        },
      }, 
    }),
    // ... rest of your plugins here
  ],
}
 
```
 
### enhancedLogs

  Configuration for enhanced logging. Defaults to enabled.

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools({
      enhancedLogs: {
        enabled: true
      }
    }),
    // ... rest of your plugins here
  ],
}
```

### injectSource 

Configuration for source injection. Defaults to enabled.


```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools({
      injectSource: {
        enabled: true
      }
    }),
    // ... rest of your plugins here
  ],
}
```

## Features

### Go to source

Allows you to open the source location on anything in your browser by clicking on it.

To trigger this behavior you need the Devtools Vite plugin installed and configured and
the Panel available on the page. Simply click on any element while holding down the Shift and Ctrl (or Meta) keys.

### Advanced console logs

Allows you to go directly to the console log location directly from the browser/terminal