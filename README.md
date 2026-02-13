# Flesh Cage

Modern CSS-in-TypeScript for React, powered by Shadow DOM and constructable stylesheets.

[![CI](https://github.com/everything-dies/flesh-cage/actions/workflows/ci.yml/badge.svg)](https://github.com/everything-dies/flesh-cage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why Flesh Cage

Flesh Cage focuses on style isolation and runtime correctness:

- Shadow DOM boundaries for real CSS encapsulation
- Lazy skin loading via dynamic imports
- Fast skin switching via `adoptedStyleSheets`
- Automatic cancellation of stale async skin loads with `AbortController`
- Optional React Suspense integration for loading states

## Install

```bash
npm install @everything-dies/flesh-cage
# or
yarn add @everything-dies/flesh-cage
```

Requirements:

- Node.js `>=18`
- React `^18 || ^19`
- React DOM `^18 || ^19`

## Quick Example

```tsx
import { Provider, styled } from '@everything-dies/flesh-cage'

type ButtonProps = React.ComponentProps<'button'>

const ButtonBase = ({ children, ...props }: ButtonProps) => (
  <button part="surface" {...props}>
    <span part="label">{children}</span>
  </button>
)

const Button = styled(ButtonBase, {
  name: 'app-button',
  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  },
  exportparts: 'surface,label',
})

export function App() {
  return (
    <Provider skin="material">
      <Button>Click me</Button>
    </Provider>
  )
}
```

## Core API

```ts
import { Provider, css, styled, useContext } from '@everything-dies/flesh-cage'
import type {
  ProviderProps,
  SkinLoader,
  Skins,
  StyledConfig,
} from '@everything-dies/flesh-cage'
```

### `styled(Component, config)`

Creates a React component backed by a custom element + shadow root.

Config:

- `name`: required custom element tag name (must include `-`)
- `skins`: map of skin names to async loaders
- `suspendable?`: when `true`, integrates with React Suspense
- additional HTML attributes (for example `exportparts`, `data-*`, `aria-*`)

### `Provider`

Provides the active skin to all descendants through React context.

```tsx
<Provider skin="material">
  <Button />
  <Provider skin="brutalist">
    <Button />
  </Provider>
</Provider>
```

### `useContext()`

Returns the current skin value from the nearest `Provider`.

### `css`

`String.raw` helper for CSS-in-TypeScript authoring ergonomics.

## Behavior Notes

- Skin names are normalized to lowercase in the custom element layer.
- Skin switches dispatch internal `change` events to trigger style replacement.
- Previous in-flight skin loads are aborted when a new skin is requested.
- On unmount, adopted stylesheets are cleared from the shadow root.

## Monorepo Layout

```text
packages/flesh-cage     # publishable library
examples/playground     # local dev playground
perf                    # performance harness
docs                    # project documentation
```

## Development

```bash
# install deps
yarn install

# run playground
yarn dev

# typecheck + lint + tests
yarn typecheck
yarn lint
yarn test

# build and validate package artifacts
yarn build:packages
yarn validate
```

## Documentation

- [Getting Started](./docs/GETTING_STARTED.md)
- [Current vs Planned](./docs/CURRENT_VS_PLANNED.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Publishing](./docs/PUBLISHING.md)
- [Docs Index](./docs/README.md)
- [Proposals](./docs/proposals/README.md)

## Contributing

Open an issue or PR, then follow the process in `docs/CONTRIBUTING.md`.

## License

MIT
