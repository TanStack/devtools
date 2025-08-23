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

```javascript
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

```javascript
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

- `eventBusConfig` - Configuration for the event bus that the devtools use to communicate with the client

```ts
{ 
  eventBusConfig: {
    // port to run the event bus on
    port: 1234,
    // console log debug logs or not
    debug: false
  }, 
}
```

- `appDir` - The directory where the react router app is located. Defaults to the "./src" relative to where vite.config is being defined.

```javascript
{
  appDir: './src',
}
```

- `editor` - The open in editor configuration which has two fields, `name` and `open`,
`name` is the name of your editor, and `open` is a function that opens the editor with the given file and line number. You can implement your version for your editor as follows:

> [!IMPORTANT] `editor` is only needed for editors that are NOT VS Code, by default this works OOTB with VS Code.

```ts
const open = (file: string, line: number) => {
  // implement your editor opening logic here
}

{
  editor: {
    name: 'vscode',
    open
  }
}
```


- `enhancedLogs` - Configuration for enhanced logging. Defaults to enabled.

```ts
{
  enhancedLogs: {
    enabled: true
  }
}
```

- `injectSource` - Configuration for source injection. Defaults to enabled.

```ts
{
  injectSource: {
    enabled: true
  }
}
```

## Features

### Go to source

Allows you to open the source location on anything in your browser by clicking on it.

To trigger this behavior you need the Devtools Vite plugin installed and configured and
the Panel available on the page. Simply click on any element while holding down the Shift and Ctrl (or Meta) keys.