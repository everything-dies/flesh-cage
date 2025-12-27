# @flesh-cage/vite-plugin

> Vite plugin for flesh-cage: Convention-based shadow components with zero boilerplate

## Features

- 🎯 **Zero Boilerplate**: Just write React components
- 📁 **File Conventions**: `*.skin.ts` for default, `*.dark.ts` for variants
- 🔄 **Auto-Discovery**: Automatically finds and wires skin files
- 🎨 **Auto-Context**: Injects `useSkinContext()` internally
- 📝 **Optional Directives**: Customize via comments when needed

## Installation

```bash
yarn add -D @flesh-cage/vite-plugin
yarn add @flesh-cage/react @flesh-cage/core
```

## Usage

### 1. Configure Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { shadowComponents } from '@flesh-cage/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    shadowComponents({
      include: 'src/components/**/*.tsx',
      skinPattern: '*.skin.ts',
      variantPattern: '*.{variant}.ts',
    })
  ]
})
```

### 2. Write Components (No Boilerplate!)

```tsx
// components/Button/Button.tsx
export const Button = ({ variant, children }) => (
  <button part="surface" variant={variant}>
    {children}
  </button>
)
```

### 3. Create Skin Files

```ts
// components/Button/Button.skin.ts (default skin)
import { COLORS } from '@/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.primary};
    padding: 1rem 2rem;
  }
`
```

```ts
// components/Button/Button.dark.ts (variant)
export default `
  [part="surface"] {
    background: #1a1a1a;
    color: white;
  }
`
```

### 4. Use with Provider

```tsx
import { SkinProvider } from '@flesh-cage/react'
import { Button } from './components/Button'

<SkinProvider skin="default">
  <Button variant="primary">Click Me</Button>
</SkinProvider>

// Plugin auto-wires everything - no manual setup needed!
```

## File Conventions

### Default Structure
```
components/
├── Button/
│   ├── Button.tsx        # Component (auto-wrapped)
│   ├── Button.skin.ts    # Default skin
│   ├── Button.dark.ts    # Dark variant
│   └── Button.light.ts   # Light variant
```

### Alternative (skins folder)
```
components/
├── Button/
│   ├── Button.tsx
│   └── skins/
│       ├── default.ts
│       ├── dark.ts
│       └── light.ts
```

## Directives (Optional)

Override defaults with comment directives:

```tsx
/**
 * @shadow-component
 * @name custom-button
 * @default-skin material
 * @parts surface,label,icon
 */
export const Button = ({ children }) => (
  <button part="surface">
    {children}
  </button>
)
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `include` | `string \| string[]` | `'src/components/**/*.{tsx,jsx}'` | Files to process |
| `exclude` | `string[]` | `['**/*.test.*', ...]` | Files to exclude |
| `skinPattern` | `string` | `'*.skin.ts'` | Default skin pattern |
| `variantPattern` | `string` | `'*.{variant}.ts'` | Variant skin pattern |
| `autoDetectSkins` | `boolean` | `true` | Auto-discover skins |
| `debug` | `boolean` | `false` | Enable debug logging |

## Note

**Current Status**: This plugin is a **placeholder** for future implementation. The core transformation logic will be added in a future iteration. For now, use the explicit APIs from `@flesh-cage/react`:

- `createShadowComponent`
- `withShadowStyles`
- Hooks + `ShadowRoot`

## License

MIT © Fernando Camargo
