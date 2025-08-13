![TanStack Devtools Header](https://github.com/tanstack/devtools/raw/main/media/repo-header.png)

# [TanStack](https://tanstack.com) Devtools v0

Coming soon...

<a href="https://twitter.com/intent/tweet?button_hashtag=TanStack" target="\_parent">
  <img alt="#TanStack" src="https://img.shields.io/twitter/url?color=%2308a0e9&label=%23TanStack&style=social&url=https%3A%2F%2Ftwitter.com%2Fintent%2Ftweet%3Fbutton_hashtag%3DTanStack" />
</a>
<a href="https://github.com/tanstack/devtools/actions?devtools=workflow%3A%22react-devtools+tests%22">
  <img src="https://github.com/tanstack/devtools/workflows/react-devtools%20tests/badge.svg" />
</a>
<a href="https://npmjs.com/package/@tanstack/react-devtools" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/@tanstack/react-devtools.svg" />
</a>
<a href="https://bundlephobia.com/result?p=@tanstack/react-devtools@latest" target="\_parent">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/@tanstack/react-devtools@latest" />
</a>
<a href="#badge">
  <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
</a>
<a href="https://github.com/tanstack/devtools/discussions">
  <img alt="Join the discussion on Github" src="https://img.shields.io/badge/Github%20Discussions%20%26%20Support-Chat%20now!-blue" />
</a>
<a href="https://github.com/tanstack/devtools" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/tanstack/react-devtools.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/tannerlinsley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/tannerlinsley.svg?style=social&label=Follow" />
</a>

## Enjoy this library?

Try other [TanStack](https://tanstack.com) libraries:

- [TanStack Router](https://github.com/TanStack/router) <img alt="" src="https://img.shields.io/github/stars/tanstack/router.svg" />
- [TanStack Query](https://github.com/TanStack/query) <img alt="" src="https://img.shields.io/github/stars/tanstack/query.svg" />
- [TanSack Table](https://github.com/TanStack/table) <img alt="" src="https://img.shields.io/github/stars/tanstack/table.svg" />
- [TanStack Virtual](https://github.com/TanStack/virtual) <img alt="" src="https://img.shields.io/github/stars/tanstack/virtual.svg" />
- [TanStack Form](https://github.com/TanStack/form) <img alt="" src="https://img.shields.io/github/stars/tanstack/form.svg" />
- [TanStack Store](https://github.com/TanStack/store) <img alt="" src="https://img.shields.io/github/stars/tanstack/store.svg" />
- [TanStack Ranger](https://github.com/TanStack/ranger) <img alt="" src="https://img.shields.io/github/stars/tanstack/ranger.svg" />
- [TanStack Pacer](https://github.com/TanStack/pacer) <img alt="" src="https://img.shields.io/github/stars/tanstack/pacer.svg" />
- [TanStack Devtools](https://github.com/TanStack/devtools) <img alt="" src="https://img.shields.io/github/stars/tanstack/devtools.svg" />
- [TanStack Config](https://github.com/TanStack/config) <img alt="" src="https://img.shields.io/github/stars/tanstack/config.svg" />

## Visit [tanstack.com/devtools](https://tanstack.com/devtools) for docs, guides, API and more!

You may know **TanSack Devtools** by our adapter names, too!

- [**React Devtools**](https://tanstack.com/devtools/latest/docs/framework/react/react-devtools)

## Summary

Coming soon...

## Quick Features

Coming soon...

## Installation

Install one of the following packages based on your framework of choice:

```bash
# Npm
npm install @tanstack/react-devtools
npm install @tanstack/solid-devtools
npm install @tanstack/devtools # no framework, just vanilla js
```

## Usage

### React

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

function App() {
  return (
    <div>
      <h1>My App</h1>
      <TanStackDevtools
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
        ]}
      />
    </div>
  )
}
```

## Development

To contribute to the development of TanStack Devtools, you can clone the repository and run the following commands:

```bash
pnpm install
pnpm dev
```

Then go to any of the example directories and run:

```bash
pnpm dev
```

## How to help?

### [Become a Sponsor](https://github.com/sponsors/tannerlinsley/)

<!-- USE THE FORCE LUKE -->
