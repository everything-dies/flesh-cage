# @flesh-cage/core

> Core runtime for flesh-cage: Shadow DOM, Constructable Stylesheets, and skin management

## Features

- 🎨 **SheetsCache**: Manages Constructable StyleSheet lifecycle with ref-counting
- 🌐 **Custom Elements**: Utilities for creating Shadow DOM components
- 📦 **Lazy Loading**: Dynamic imports for code-splitting skins
- ♻️ **Memory Efficient**: Automatic cleanup via ref-counting
- 🎯 **Type-Safe**: Full TypeScript support

## Installation

```bash
yarn add @flesh-cage/core
```

## Usage

### SheetsCache

```ts
import { SheetsCache } from '@flesh-cage/core'

// Define your skins
const cache = new SheetsCache({
  material: () => import('./skins/material'),
  dark: () => import('./skins/dark'),
})

// Acquire a skin (loads if needed, increments ref count)
const sheet = await cache.acquire('material')
shadowRoot.adoptedStyleSheets = [sheet]

// Release when component unmounts (decrements ref count)
cache.release('material')
```

### Custom Elements

```ts
import { createCustomElement } from '@flesh-cage/core'

const ButtonElement = createCustomElement({
  name: 'button-element',
  mode: 'open',
  parts: ['surface', 'label'],
})

customElements.define('button-element', ButtonElement)
```

## License

MIT © Fernando Camargo
