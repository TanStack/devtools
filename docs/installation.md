---
title: Installation
id: installation
---

You can install TanStack Devtools with any [NPM](https://npmjs.com) package manager.

Only install one of the following packages depending on your use case:

## React

```sh
npm install -D @tanstack/react-devtools
npm install -D @tanstack/devtools-vite
```

TanStack Devtools is compatible with React v16.8+

## Solid

```sh
npm install -D @tanstack/solid-devtools
npm install -D @tanstack/devtools-vite
```

TanStack Devtools is compatible with Solid v1.9.5+

## Vanilla JS

```sh
npm install -D @tanstack/devtools
```

Install the the core `@tanstack/devtools` package to use with any framework or without a framework. Each framework package up above will also re-export everything from this core package.


## Production Builds

If you want to have the devtools in production builds, you can install the core `@tanstack/devtools` package as a regular dependency:

```sh
npm install @tanstack/devtools
npm install -D @tanstack/devtools-vite
```
 

Read more about using the devtools in production in our [Production docs](./production.md).