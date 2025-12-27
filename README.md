# Flesh Cage

> Modern CSS-in-TypeScript with Shadow DOM & Constructable Stylesheets

[![CI](https://github.com/fernandocamargo/flesh-cage/actions/workflows/ci.yml/badge.svg)](https://github.com/fernandocamargo/flesh-cage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What is Flesh Cage?

Flesh Cage is a **paradigm shift** in component styling that combines four powerful concepts:

1. **🎨 Skins (Not Themes)** - Complete visual languages, not variable swaps (CSS Zen Garden at scale)
2. **🌐 Attribute-Driven Styling** - Semantic attributes (ARIA, data-\*) for styling, not prop interpolation
3. **📝 CSS-in-TypeScript** - Full ecosystem access at build-time, zero runtime cost
4. **⚡ Constructable Stylesheets + Shadow DOM** - 99% memory savings, true encapsulation

## Quick Start

```bash
yarn add @flesh-cage/react @flesh-cage/core
```

```tsx
import { createShadowComponent, SkinProvider } from '@flesh-cage/react'

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

## Packages

| Package                                           | Version | Description                                                  |
| ------------------------------------------------- | ------- | ------------------------------------------------------------ |
| [@flesh-cage/core](./packages/core)               | -       | Core runtime (SheetsCache, custom elements)                  |
| [@flesh-cage/react](./packages/react)             | -       | React bindings (Provider, createShadowComponent, HOC, hooks) |
| [@flesh-cage/vite-plugin](./packages/vite-plugin) | -       | Vite plugin (convention-based, zero boilerplate)             |

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
- **Small bundles** - Core: 5 KB, React: 8 KB (gzipped)

## Development

```bash
# Install dependencies
yarn install

# Start playground
yarn dev

# Run tests
yarn test

# Build packages
yarn build

# Lint & format
yarn lint
yarn format
```

## Local Development

The monorepo includes a **playground** for testing packages locally:

```bash
yarn dev  # Starts Vite on http://localhost:3000
```

Changes to packages hot-reload instantly - no build step needed!

## Philosophy

Read the design documentation:

- [Complete Architecture](./ideas/design-docs/ARCHITECTURE_COMPLETE.md)
- [Skins vs Themes Philosophy](./ideas/design-docs/SKINS_VS_THEMES_PHILOSOPHY.md)
- [Attribute-Driven Styling](./ideas/design-docs/ATTRIBUTE_DRIVEN_STYLING.md)
- [Provider Pattern](./ideas/design-docs/PROVIDER_PATTERN.md)
- [Benchmark Results](./ideas/design-docs/BENCHMARK_CORRECTION_SUMMARY.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT © Fernando Camargo

---

**Built with cutting-edge web platform primitives:**

- Shadow DOM for true encapsulation
- Constructable Stylesheets for performance
- Web Components for interoperability
- TypeScript for type safety
- React for developer experience
