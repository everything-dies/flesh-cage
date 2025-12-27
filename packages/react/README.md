# @flesh-cage/react

> React bindings for flesh-cage: Provider, createShadowComponent, HOC, and hooks

## Features

- 🎨 **SkinProvider**: Context-based skin management (no prop drilling!)
- 🏭 **createShadowComponent**: Factory for shadow components
- 🔄 **withShadowStyles**: HOC for wrapping existing components
- 🪝 **Hooks**: `useSkinContext`, `useShadowStyles` for custom implementations
- 🌐 **ShadowRoot**: Component for manual shadow DOM usage

## Installation

```bash
yarn add @flesh-cage/react @flesh-cage/core
```

## Usage

### SkinProvider (Recommended)

```tsx
import { SkinProvider } from '@flesh-cage/react'

function App() {
  const [skin, setSkin] = useState('material')

  return (
    <SkinProvider skin={skin}>
      <Button>Click Me</Button>
      <Card>Content</Card>
    </SkinProvider>
  )
}
```

### createShadowComponent

```tsx
import { createShadowComponent } from '@flesh-cage/react'

export const Button = createShadowComponent({
  name: 'button',
  skins: {
    material: () => import('./skins/material'),
    dark: () => import('./skins/dark'),
  },
  render: ({ variant, children }) => (
    <button part="surface" variant={variant}>
      {children}
    </button>
  ),
})

// Usage - skin comes from provider!
<SkinProvider skin="material">
  <Button variant="primary">Click Me</Button>
</SkinProvider>
```

### withShadowStyles (HOC)

```tsx
import { withShadowStyles } from '@flesh-cage/react'

const ButtonBase = ({ variant, children }) => (
  <button part="surface" variant={variant}>
    {children}
  </button>
)

export const Button = withShadowStyles(ButtonBase, {
  name: 'button',
  skins: {
    material: () => import('./skins/material'),
  },
})
```

### Nested Providers (Override Skins)

```tsx
<SkinProvider skin="material">
  <Button>Material</Button>

  <SkinProvider skin="dark">
    <Button>Dark</Button>
  </SkinProvider>

  <Button>Back to Material</Button>
</SkinProvider>
```

## Important: No `skin` Prop!

Components **DO NOT** accept a `skin` prop. Skin is managed via `<SkinProvider>` context only.

```tsx
// ✅ CORRECT
<SkinProvider skin="material">
  <Button>Click Me</Button>
</SkinProvider>

// ❌ WRONG - No skin prop!
<Button skin="material">Click Me</Button>
```

To override a skin for a specific section, use nested providers:

```tsx
<SkinProvider skin="material">
  <Button>Normal</Button>

  <SkinProvider skin="brutalist">
    <Button>Different skin!</Button>
  </SkinProvider>
</SkinProvider>
```

## License

MIT © Fernando Camargo
