# Current vs Planned Features

This document clearly separates **implemented features** from **planned features** to avoid confusion.

Last updated: 2026-01-02

---

## ✅ Current Features (Implemented)

### Core API

**`styled(Component, config)`** - Create shadow components with skins

```tsx
import { styled } from '@everything-dies/flesh-cage'

const ButtonBase = ({ children }) => (
  <button part="surface">
    <span part="label">{children}</span>
  </button>
)

export const Button = styled(ButtonBase, {
  name: 'styled-button',
  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  },
  exportparts: 'label, surface',
  suspendable: false, // Optional: integrate with React Suspense
})
```

**`Provider`** - Context-based skin management

```tsx
import { Provider } from '@everything-dies/flesh-cage'

function App() {
  return (
    <Provider skin="material">
      <Button>Uses material skin</Button>

      <Provider skin="brutalist">
        <Button>Uses brutalist skin</Button>
      </Provider>
    </Provider>
  )
}
```

**`useContext()`** - Access current skin from context

```tsx
import { useContext } from '@everything-dies/flesh-cage'

function MyComponent() {
  const skin = useContext()
  return <div>Current skin: {skin}</div>
}
```

### Skin Loading

**Single-chunk lazy loading**

```tsx
// Skin definition (current)
export default `
  [part="surface"] {
    background: #2196f3;
    color: white;
    /* ... all CSS in one chunk ... */
  }
`

// Usage
skins: {
  material: () => import('./skins/material') // Lazy-loaded
}
```

### Shadow DOM Integration

- ✅ Automatic Shadow DOM creation
- ✅ Constructable Stylesheets adoption
- ✅ CSS encapsulation
- ✅ `exportparts` attribute support
- ✅ React Suspense integration (via `suspendable` option)
- ✅ Automatic abort of stale skin loads (via `AbortController`)

### Configuration Options

**`styled()` accepts:**

- `name` - Custom element tag name (required, must contain hyphen)
- `skins` - Map of skin names to lazy loader functions
- `suspendable` - Enable React Suspense integration (default: `false`)
- Any HTML attributes (e.g., `exportparts`, `class`, `data-*`)

**Suspendable components** integrate with React Suspense boundaries:

```tsx
export const Button = styled(ButtonBase, {
  name: 'styled-button',
  skins: { material: () => import('./material') },
  suspendable: true, // Enable Suspense
})

// Use with Suspense boundary
<Suspense fallback={<div>Loading...</div>}>
  <Button>Click Me</Button>
</Suspense>
```

**Automatic abort on skin switch** prevents race conditions when rapidly switching skins. Uses `AbortController` internally - if you switch from skin A to skin B before A finishes loading, A's load is automatically aborted.

### Type System

```typescript
import type {
  SkinLoader,
  Skins,
  StyledConfig,
} from '@everything-dies/flesh-cage'

// SkinLoader = () => Promise<{ default: string }>
// Skins<T> = Record<T, SkinLoader>
// StyledConfig<Names> = { name: string, skins: Skins<Names>, suspendable?: boolean, ... }
```

---

## 🚧 Planned Features (Not Yet Implemented)

See [docs/proposals/](./proposals/) for detailed design documents.

### Advanced Loading Strategies

#### Array-Based Skin API

**Status**: Proposal only
**Proposal**: [SIMPLIFIED_ARRAY_API.md](./proposals/SIMPLIFIED_ARRAY_API.md)

```tsx
// NOT IMPLEMENTED YET
export const material = [
  () => import('./material/critical'), // Load first
  () => import('./material/animations'), // Load second
  () => import('./material/variants'), // Load last
]
```

#### Progressive Chunk Loading

**Status**: Proposal only
**Proposal**: [ASYNC_SKIN_LOADING_PLAN.md](./proposals/ASYNC_SKIN_LOADING_PLAN.md)

```tsx
// NOT IMPLEMENTED YET
export async function* streamMaterial() {
  yield { name: 'critical', css: '...' }
  yield { name: 'animations', css: '...' }
}
```

### Alternative APIs

#### `createShadowComponent()` Factory

**Status**: Not implemented

```tsx
// NOT IMPLEMENTED YET
const Button = createShadowComponent({
  name: 'button',
  skins: { material: () => import('./material') },
  render: ({ children }) => <button>{children}</button>,
})
```

**Note**: Current equivalent is `styled(ComponentBase, config)`

#### `withShadowStyles()` HOC

**Status**: Not implemented

```tsx
// NOT IMPLEMENTED YET
const Button = withShadowStyles(ButtonBase, {
  name: 'button',
  skins: { material: () => import('./material') },
})
```

**Note**: Current equivalent is `styled(ComponentBase, config)`

#### `<ShadowRoot>` Component

**Status**: Not implemented

```tsx
// NOT IMPLEMENTED YET
export const Button = ({ children }) => (
  <ShadowRoot name="button" skins={{ material: () => import('./material') }}>
    <button>{children}</button>
  </ShadowRoot>
)
```

**Note**: Current equivalent is `styled(ComponentBase, config)` wrapper

### Developer Experience

#### Hot Module Replacement (HMR)

**Status**: Proposal only
**Proposals**:

- [HMR_INTEGRATION_GUIDE.md](./proposals/HMR_INTEGRATION_GUIDE.md)
- [HMR_BUNDLER_COMPARISON.md](./proposals/HMR_BUNDLER_COMPARISON.md)
- [HMR_EXTENDED_BUNDLERS.md](./proposals/HMR_EXTENDED_BUNDLERS.md)

#### Vite Plugin

**Status**: Removed (will be redesigned in future)

---

## Migration Guide

### If You're Using "Planned" APIs from Documentation

Some documentation may incorrectly show planned APIs. Here's how to use the current API:

#### Instead of `createShadowComponent()`

```tsx
// ❌ Documented (not implemented)
const Button = createShadowComponent({
  name: 'button',
  skins: { material: () => import('./material') },
  render: ({ children }) => <button>{children}</button>,
})

// ✅ Current API
const ButtonBase = ({ children }) => <button>{children}</button>
export const Button = styled(ButtonBase, {
  name: 'button',
  skins: { material: () => import('./material') },
})
```

#### Instead of `withShadowStyles()`

```tsx
// ❌ Documented (not implemented)
const Button = withShadowStyles(ButtonBase, {
  name: 'button',
  skins: { material: () => import('./material') },
})

// ✅ Current API (identical)
const Button = styled(ButtonBase, {
  name: 'button',
  skins: { material: () => import('./material') },
})
```

#### Instead of `<ShadowRoot>` component

```tsx
// ❌ Documented (not implemented)
<ShadowRoot name="button" skins={{ material: () => import('./material') }}>
  <button>{children}</button>
</ShadowRoot>

// ✅ Current API
const ButtonBase = ({ children }) => <button>{children}</button>
const Button = styled(ButtonBase, {
  name: 'button',
  skins: { material: () => import('./material') },
})

// Then use:
<Button>{children}</Button>
```

---

## Contributing

When documenting features:

1. **Always verify implementation exists** - Check `packages/flesh-cage/src/` for actual code
2. **Use current API in examples** - `styled()`, not `createShadowComponent()`
3. **Label proposals clearly** - Use "Proposal" or "Planned" prefixes
4. **Reference this document** - Link to CURRENT_VS_PLANNED.md for clarity

---

## Quick Reference

| Feature                   | Status             | Import                        |
| ------------------------- | ------------------ | ----------------------------- |
| `styled()`                | ✅ Implemented     | `@everything-dies/flesh-cage` |
| `Provider`                | ✅ Implemented     | `@everything-dies/flesh-cage` |
| `useContext()`            | ✅ Implemented     | `@everything-dies/flesh-cage` |
| `suspendable` option      | ✅ Implemented     | Part of `styled()` config     |
| AbortController           | ✅ Implemented     | Automatic (internal)          |
| `createShadowComponent()` | ❌ Not implemented | -                             |
| `withShadowStyles()`      | ❌ Not implemented | -                             |
| `<ShadowRoot>`            | ❌ Not implemented | -                             |
| Array-based skins         | ❌ Not implemented | -                             |
| Streaming skins           | ❌ Not implemented | -                             |
| Vite plugin               | ❌ Removed         | -                             |
