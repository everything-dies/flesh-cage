# @everything-dies/flesh-cage

> Modern CSS-in-TypeScript with Shadow DOM & Constructable Stylesheets

[![CI](https://github.com/everything-dies/flesh-cage/actions/workflows/ci.yml/badge.svg)](https://github.com/everything-dies/flesh-cage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What is Flesh Cage?

Flesh Cage is a **paradigm shift** in component styling that combines four powerful concepts:

1. **🎨 Skins (Not Themes)** - Complete visual languages, not variable swaps (CSS Zen Garden at scale)
2. **🌐 Attribute-Driven Styling** - Semantic attributes (ARIA, data-\*) for styling, not prop interpolation
3. **📝 CSS-in-TypeScript** - Full ecosystem access at build-time, zero runtime cost
4. **⚡ Constructable Stylesheets + Shadow DOM** - 99% memory savings, true encapsulation

## Quick Start

```bash
npm install @everything-dies/flesh-cage
# or
yarn add @everything-dies/flesh-cage
```

```tsx
import { createShadowComponent, SkinProvider } from '@everything-dies/flesh-cage'

// Define component with multiple skins
const Button = createShadowComponent({
  name: 'button',
  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  },
  render: ({ children }) => <button part="surface">{children}</button>,
})

// Use with Provider (no prop drilling!)
function App() {
  return (
    <SkinProvider skin="material">
      <Button>Click Me</Button>
    </SkinProvider>
  )
}
```

## Package Exports

This package provides multiple entry points for different use cases:

### Main Export (Component Macros)

```typescript
import { SkinProvider, createShadowComponent, withShadowStyles } from '@everything-dies/flesh-cage'
```

Framework-agnostic component macros (currently React-compatible). Includes:

- `SkinProvider` - Context-based skin management
- `createShadowComponent` - Factory for shadow components
- `withShadowStyles` - HOC for wrapping existing components
- `ShadowRoot` - Component for manual shadow DOM
- `useSkinContext`, `useShadowStyles` - Hooks

### Core Utilities

```typescript
import { SheetsCache, createCustomElement } from '@everything-dies/flesh-cage/core'
```

For advanced use cases or framework-agnostic implementations:

- `SheetsCache` - Manages Constructable StyleSheet lifecycle
- `createCustomElement` - Utilities for Shadow DOM components

### Vite Plugin

```typescript
import { shadowComponents } from '@everything-dies/flesh-cage/vite'
```

Convention-based Vite plugin (future feature - currently placeholder).

## Features

### ✨ Provider Pattern (No Prop Drilling!)

```tsx
<SkinProvider skin="material">
  <Button>Uses material</Button>

  {/* Nested providers override */}
  <SkinProvider skin="dark">
    <Button>Uses dark</Button>
  </SkinProvider>
</SkinProvider>
```

### 🎨 Multiple API Flavors

**1. createShadowComponent (Factory)**

```tsx
const Button = createShadowComponent({
  name: 'button',
  skins: { material: () => import('./material') },
  render: ({ children }) => <button>{children}</button>,
})
```

**2. withShadowStyles (HOC)**

```tsx
const ButtonBase = ({ children }) => <button>{children}</button>
export const Button = withShadowStyles(ButtonBase, {
  name: 'button',
  skins: { material: () => import('./material') },
})
```

**3. Hooks + ShadowRoot**

```tsx
export const Button = ({ children }) => (
  <ShadowRoot name="button" skins={{ material: () => import('./material') }}>
    <button>{children}</button>
  </ShadowRoot>
)
```

### 📊 Performance

- **99% memory savings** - Shared CSSStyleSheet objects (not duplicated strings)
- **Lazy loading** - Dynamic imports for code-splitting
- **Fast theme switching** - 8× faster than traditional CSS-in-JS
- **Small bundle** - ~10 KB total (gzipped)

## Documentation

- [Complete Architecture](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/ARCHITECTURE_COMPLETE.md)
- [Skins vs Themes Philosophy](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/SKINS_VS_THEMES_PHILOSOPHY.md)
- [Attribute-Driven Styling](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/ATTRIBUTE_DRIVEN_STYLING.md)
- [Provider Pattern](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/PROVIDER_PATTERN.md)
- [Benchmark Results](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/BENCHMARK_CORRECTION_SUMMARY.md)

## Contributing

See [CONTRIBUTING.md](https://github.com/everything-dies/flesh-cage/blob/main/CONTRIBUTING.md) for development guidelines.

## License

MIT © Fernando Camargo

---

**Built with cutting-edge web platform primitives:**

- Shadow DOM for true encapsulation
- Constructable Stylesheets for performance
- Web Components for interoperability
- TypeScript for type safety
- React for developer experience
