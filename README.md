# Flesh Cage

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
import { styled, Provider } from '@everything-dies/flesh-cage'

// Define base component
const ButtonBase = ({ children }) => (
  <button part="surface">
    <span part="label">{children}</span>
  </button>
)

// Create shadow component with multiple skins
export const Button = styled(ButtonBase, {
  name: 'styled-button',
  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  },
  exportparts: 'label, surface',
})

// Use with Provider (no prop drilling!)
function App() {
  return (
    <Provider skin="material">
      <Button>Click Me</Button>
    </Provider>
  )
}
```

## Package Structure

This is a **single-package library** focused on the core component API:

```typescript
// Main export - Component API
import { styled, Provider, useContext } from '@everything-dies/flesh-cage'

// Type definitions
import type {
  SkinLoader,
  Skins,
  StyledConfig,
} from '@everything-dies/flesh-cage'
```

**One install, everything included:**

- ✅ Component API (`styled()`, `Provider`, hooks)
- ✅ Shadow DOM integration with Constructable Stylesheets
- ✅ Automatic skin loading with caching
- ✅ React Suspense support
- ✅ Full TypeScript types

## Features

### ✨ Provider Pattern (No Prop Drilling!)

```tsx
<Provider skin="material">
  <Button>Uses material</Button>

  {/* Nested providers override */}
  <Provider skin="dark">
    <Button>Uses dark</Button>
  </Provider>
</Provider>
```

### 🎨 Core API

**`styled(Component, config)`** - Create shadow components

```tsx
const ButtonBase = ({ children }) => <button>{children}</button>

export const Button = styled(ButtonBase, {
  name: 'styled-button',
  skins: { material: () => import('./material') },
  exportparts: 'label, surface',
  suspendable: false, // Optional: integrate with React Suspense
})
```

**Configuration Options:**

- `name` - Custom element tag name (required, must contain hyphen)
- `skins` - Map of skin names to lazy loader functions
- `suspendable` - Enable React Suspense integration for loading states (default: `false`)
- Any HTML attributes (e.g., `exportparts`, `class`, `data-*`)

**Suspendable Components:**

When `suspendable: true`, the component integrates with React Suspense boundaries, allowing you to show fallback UI while skins load:

```tsx
export const Button = styled(ButtonBase, {
  name: 'styled-button',
  skins: { material: () => import('./material') },
  suspendable: true, // Enable Suspense integration
})

// Use with Suspense boundary
<Suspense fallback={<div>Loading skin...</div>}>
  <Button>Click Me</Button>
</Suspense>
```

**Automatic Abort on Skin Switch:**

Flesh Cage automatically aborts stale skin loads when rapidly switching between skins. If you click a button to load skin A, then immediately click another button to load skin B, the incomplete load for skin A will be aborted, preventing stale updates. This uses the standard `AbortController` API internally.

**`Provider`** - Context-based skin management

```tsx
<Provider skin="material">
  <Button>Uses material skin</Button>
</Provider>
```

**`useContext()`** - Access current skin

```tsx
import { useContext } from '@everything-dies/flesh-cage'

function MyComponent() {
  const skin = useContext()
  return <div>Current skin: {skin}</div>
}
```

### 📊 Performance

- **99% memory savings** - Shared CSSStyleSheet objects (not duplicated strings)
- **Lazy loading** - Dynamic imports for code-splitting
- **Fast theme switching** - 8× faster than traditional CSS-in-JS
- **Small bundle** - ~10 KB total (gzipped), tree-shakeable

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

## Documentation

### Current Features

- **[Current vs Planned Features](./docs/CURRENT_VS_PLANNED.md)** - Clear distinction between implemented and planned features
- [Getting Started](./docs/GETTING_STARTED.md) - Quick start guide
- [Verification Checklist](./docs/VERIFICATION.md) - System verification

### Design Philosophy

- [Complete Architecture](./.idea/design-docs/ARCHITECTURE_COMPLETE.md)
- [Skins vs Themes Philosophy](./.idea/design-docs/SKINS_VS_THEMES_PHILOSOPHY.md)
- [Attribute-Driven Styling](./.idea/design-docs/ATTRIBUTE_DRIVEN_STYLING.md)
- [Provider Pattern](./.idea/design-docs/PROVIDER_PATTERN.md)
- [Benchmark Results](./.idea/design-docs/BENCHMARK_CORRECTION_SUMMARY.md)

### Future Proposals

See [docs/proposals/](./docs/proposals/) for planned features (not yet implemented)

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development guidelines.

## License

MIT © Fernando Camargo

---

**Built with cutting-edge web platform primitives:**

- Shadow DOM for true encapsulation
- Constructable Stylesheets for performance
- Web Components for interoperability
- TypeScript for type safety
- React for developer experience
