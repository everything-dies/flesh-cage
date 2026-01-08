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

## API

### Main Export

```typescript
import { styled, Provider, useContext } from '@everything-dies/flesh-cage'
import type {
  SkinLoader,
  Skins,
  StyledConfig,
} from '@everything-dies/flesh-cage'
```

**Component API:**

- `styled(Component, config)` - Create shadow components with skins
- `Provider` - Context-based skin management
- `useContext()` - Access current skin from context

**Type Definitions:**

- `SkinLoader` - Function type for lazy-loading skin CSS
- `Skins<T>` - Record mapping skin names to loaders
- `StyledConfig<Names>` - Configuration object for `styled()`
- `ProviderProps` - Props for Provider component

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
- `suspendable` - Enable React Suspense integration (default: `false`)
- Any HTML attributes (e.g., `exportparts`, `class`, `data-*`)

**Suspendable Components:**

When `suspendable: true`, the component integrates with React Suspense:

```tsx
export const Button = styled(ButtonBase, {
  name: 'styled-button',
  skins: { material: () => import('./material') },
  suspendable: true,
})

// Use with Suspense boundary
<Suspense fallback={<div>Loading skin...</div>}>
  <Button>Click Me</Button>
</Suspense>
```

**Automatic Abort on Skin Switch:**

Flesh Cage automatically aborts stale skin loads when switching skins rapidly. Uses `AbortController` internally to prevent race conditions where a slow-loading skin overwrites a fast-loading one.

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

- **Efficient memory usage** - Shared CSSStyleSheet objects (not duplicated strings)
- **Lazy loading** - Dynamic imports for code-splitting
- **Fast theme switching** - Direct stylesheet replacement via adoptedStyleSheets
- **Small bundle** - Minimal runtime overhead, tree-shakeable

## Documentation

### Essential

- **[Current vs Planned Features](https://github.com/everything-dies/flesh-cage/blob/main/docs/CURRENT_VS_PLANNED.md)** - What's implemented vs planned
- [Getting Started](https://github.com/everything-dies/flesh-cage/blob/main/docs/GETTING_STARTED.md)

### Design Philosophy

- [Complete Architecture](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/ARCHITECTURE_COMPLETE.md)
- [Skins vs Themes Philosophy](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/SKINS_VS_THEMES_PHILOSOPHY.md)
- [Attribute-Driven Styling](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/ATTRIBUTE_DRIVEN_STYLING.md)
- [Provider Pattern](https://github.com/everything-dies/flesh-cage/blob/main/.idea/design-docs/PROVIDER_PATTERN.md)

### Future Features

- [Proposals](https://github.com/everything-dies/flesh-cage/blob/main/docs/proposals/) - Planned features (not yet implemented)

## Contributing

See [CONTRIBUTING.md](https://github.com/everything-dies/flesh-cage/blob/main/docs/CONTRIBUTING.md) for development guidelines.

## License

MIT © Fernando Camargo

---

**Built with cutting-edge web platform primitives:**

- Shadow DOM for true encapsulation
- Constructable Stylesheets for performance
- Web Components for interoperability
- TypeScript for type safety
- React for developer experience
