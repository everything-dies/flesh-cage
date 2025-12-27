# API Flavor 5: Vite Plugin (Convention-Based)

**Version:** 0.1
**Date:** 2025-12-27
**Focus:** Zero-configuration, file-based conventions, minimal code changes

---

## Philosophy

**"Just write components. We'll handle the rest."**

- No imports from the library
- No wrapper functions
- No HOCs or hooks
- Just conventions + optional directives

---

## Basic Usage: Convention Over Configuration

### File Structure

```
src/
├── components/
│   ├── button/
│   │   ├── Button.tsx              # Component
│   │   ├── Button.skin.ts          # Default skin
│   │   ├── Button.dark.ts          # Dark variant
│   │   ├── Button.material.ts      # Material variant
│   │   └── Button.placeholder.tsx  # Optional loading placeholder
│   │
│   └── card/
│       ├── Card.tsx
│       ├── Card.light.ts
│       └── Card.dark.ts
```

### Component (Zero Changes!)

```typescript
// src/components/button/Button.tsx

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

// Just a normal React component!
export const Button = ({ variant = 'primary', children }: ButtonProps) => (
  <button part="surface" variant={variant}>
    <span part="label">{children}</span>
  </button>
)
```

### Skin Files

```typescript
// src/components/button/Button.skin.ts (default skin)
import { COLORS, SPACING } from '@/design-system/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.primary};
    padding: ${SPACING.md} ${SPACING.lg};
  }
`
```

```typescript
// src/components/button/Button.dark.ts (dark variant)
import { COLORS, SPACING } from '@/design-system/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.darkBg};
    color: ${COLORS.darkText};
    padding: ${SPACING.md} ${SPACING.lg};
  }
`
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { shadowComponents } from '@my-lib/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    shadowComponents({
      // Convention-based discovery
      include: 'src/components/**/*.tsx',

      // Naming conventions
      skinPattern: '*.skin.ts',      // Default skin
      variantPattern: '*.{name}.ts', // Named variants (dark, light, etc.)

      // Optional: placeholder for Suspense fallback
      placeholderPattern: '*.placeholder.tsx',
    })
  ]
})
```

### What the Plugin Does

1. **Scans** for components matching `include` pattern
2. **Discovers** skins using file naming conventions
3. **Generates** shadow component wrappers at build-time
4. **Injects** imports and transformations
5. **Zero runtime overhead** - everything is build-time

---

## Generated Output (What Plugin Creates)

### Before Plugin (What You Write)

```typescript
// Button.tsx
export const Button = ({ children }) => <button>{children}</button>
```

### After Plugin (What Gets Generated)

```typescript
// Button.tsx (transformed)
import { __shadowComponent } from '@my-lib/runtime'

const ButtonBase = ({ children }) => <button>{children}</button>

export const Button = __shadowComponent(ButtonBase, {
  name: 'button',
  skins: {
    default: () => import('./Button.skin'),
    dark: () => import('./Button.dark'),
    material: () => import('./Button.material'),
  },
  defaultSkin: 'default',
  // Auto-detected from component file
})
```

**Developer never sees this!** Plugin handles it all.

---

## Advanced: Directives for Overrides

### Component-Level Directives

```typescript
// src/components/button/Button.tsx

/**
 * @shadow-component
 * @name custom-button
 * @skins material, brutalist, glass
 * @default-skin material
 * @parts surface, label, icon
 */
export const Button = ({ variant, children }: ButtonProps) => (
  <button part="surface" variant={variant}>
    <span part="label">{children}</span>
  </button>
)
```

**Directive options:**
- `@shadow-component` - Explicitly enable (auto-detected by default)
- `@name` - Custom element name (defaults to lowercase component name)
- `@skins` - Explicitly list skins (otherwise auto-discovered)
- `@default-skin` - Which skin to use by default
- `@parts` - Export parts list (for documentation/types)
- `@no-shadow` - Disable for this component

### Per-Skin Directives

```typescript
// Button.dark.ts

/**
 * @skin-name dark-mode
 * @extends default
 * @priority high
 */
import { COLORS } from '@/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.dark};
  }
`
```

**Skin directive options:**
- `@skin-name` - Override skin name (defaults to filename)
- `@extends` - Inherit from another skin
- `@priority` - Load order priority

---

## Alternative: Inline Configuration

### Via Export Config

```typescript
// Button.tsx

export const Button = ({ children }) => <button>{children}</button>

// Plugin recognizes this export
export const shadowConfig = {
  name: 'button',
  skins: {
    material: './skins/material',
    brutalist: './skins/brutalist',
  },
  defaultSkin: 'material',
  parts: ['surface', 'label']
}
```

Plugin transforms to:
```typescript
import { __shadowComponent } from '@my-lib/runtime'

const ButtonBase = ({ children }) => <button>{children}</button>

export const Button = __shadowComponent(ButtonBase, {
  name: 'button',
  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  },
  defaultSkin: 'material',
})
```

---

## Plugin Configuration Options

### Minimal Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    shadowComponents()  // Uses all defaults!
  ]
})
```

**Defaults:**
- `include: 'src/components/**/*.{tsx,jsx}'`
- `skinPattern: '*.skin.ts'`
- `variantPattern: '*.{variant}.ts'`
- `defaultSkin: 'default'`

### Full Configuration

```typescript
export default defineConfig({
  plugins: [
    shadowComponents({
      // Component discovery
      include: ['src/components/**/*.tsx', 'src/ui/**/*.tsx'],
      exclude: ['**/*.test.tsx', '**/*.stories.tsx'],

      // File naming conventions
      skinPattern: '*.skin.ts',           // Default skin
      variantPattern: '*.{variant}.ts',   // Named variants
      placeholderPattern: '*.placeholder.tsx',

      // Skin configuration
      defaultSkin: 'default',
      autoDetectSkins: true,              // Auto-discover skin files

      // Custom element naming
      elementPrefix: 'my-',               // <my-button> instead of <button>
      elementNaming: 'kebab-case',        // button-primary or buttonPrimary

      // Shadow DOM configuration
      shadowMode: 'open',                 // 'open' | 'closed'

      // Parts export
      autoExportParts: true,              // Auto-detect [part="..."]

      // Code generation
      generateTypes: true,                // Generate TypeScript types
      generateDocs: true,                 // Generate documentation

      // Advanced
      transform: (component, config) => {
        // Custom transformation logic
        return transformedComponent
      },

      // Debugging
      debug: false,                       // Log plugin activity
      dryRun: false,                      // Don't write files (test mode)
    })
  ]
})
```

---

## Explicit Mapping (When Conventions Don't Work)

```typescript
export default defineConfig({
  plugins: [
    shadowComponents({
      // Explicit component mapping
      components: {
        Button: {
          source: './components/button/Button.tsx',
          name: 'button',
          skins: {
            default: './components/button/skins/default.ts',
            dark: './components/button/skins/dark.ts',
            material: './components/button/skins/material.ts',
          },
          defaultSkin: 'material',
          parts: ['surface', 'label'],
        },

        Card: {
          source: './components/card/Card.tsx',
          skins: {
            light: './components/card/light.ts',
            dark: './components/card/dark.ts',
          }
        }
      }
    })
  ]
})
```

---

## Generated TypeScript Types

Plugin automatically generates types:

```typescript
// generated/shadow-components.d.ts (auto-generated)

declare module '@my-lib/runtime' {
  export interface ShadowComponentProps {
    skin?: string
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'button': React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement> & {
          part?: string
          exportparts?: string
        },
        HTMLButtonElement
      >
    }
  }
}

// Component-specific types
export interface ButtonSkins {
  default: './components/button/Button.skin'
  dark: './components/button/Button.dark'
  material: './components/button/Button.material'
}

export type ButtonSkinName = keyof ButtonSkins

// Augment component props
declare module './components/button/Button' {
  export interface ButtonProps {
    skin?: ButtonSkinName
  }
}
```

---

## Migration Path: Gradual Opt-In

### Phase 1: Enable Plugin (No Changes)

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    shadowComponents({
      autoDetect: false,  // Don't transform anything yet
    })
  ]
})
```

Plugin is installed but inactive.

### Phase 2: Opt-In Per Component

```typescript
// Button.tsx

/** @shadow-component */  // ← Opt-in directive
export const Button = ({ children }) => <button>{children}</button>
```

Only components with directive are transformed.

### Phase 3: Enable Auto-Detection

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    shadowComponents({
      autoDetect: true,     // Transform all components with skins
      include: 'src/components/**/*.tsx',
    })
  ]
})
```

All components with matching skin files are automatically transformed.

---

## Adoption Analysis

### ✅ Familiarity: MAXIMUM

```typescript
// Just write normal React components!
export const Button = ({ children }) => (
  <button>{children}</button>
)

// No imports, no wrappers, nothing!
```

**Feels like:**
- Next.js file-based routing (convention)
- CSS Modules (*.module.css convention)
- Remix (file-based loaders)

**Developers think:** "I already know this pattern!"

---

### ✅ Progressive Enhancement: PERFECT

```typescript
// Start: No plugin
export const Button = ({ children }) => <button>{children}</button>

// Add: Skin file (Button.skin.ts)
// Plugin auto-detects and wraps!

// Add: More skins (Button.dark.ts, Button.light.ts)
// Plugin auto-discovers!

// Add: Directives (when you need control)
/** @shadow-component @default-skin dark */
```

**Zero breaking changes at each step!**

---

### ✅ Low Ceremony: LOWEST POSSIBLE

**No imports:**
```typescript
// ❌ Other APIs
import { createShadowComponent } from '@my-lib/react'
import { withShadowStyles } from '@my-lib/react'
import { useShadowStyles } from '@my-lib/react'

// ✅ Plugin API
// Nothing! Just write components.
```

**No wrappers:**
```typescript
// ❌ Other APIs
export const Button = createShadowComponent({ ... })
export const Button = withShadowStyles(ButtonBase, { ... })

// ✅ Plugin API
export const Button = ({ children }) => <button>{children}</button>
```

---

### ⚠️ Resistance Points

1. **Build-time dependency**
   - Requires Vite (but most modern React apps use it)
   - Plugin adds complexity to build
   - May conflict with other plugins

2. **"Magic" concerns**
   - Code transformation happens invisibly
   - Debugging can be harder
   - Source maps critical

3. **Learning curve for directives**
   - Need to learn directive syntax
   - Not standard JSDoc
   - May confuse TypeScript/ESLint

4. **File conventions**
   - Developers must follow naming patterns
   - Breaking convention = component not found
   - May conflict with existing conventions

---

### Mitigation Strategies

#### 1. Excellent Error Messages

```typescript
// Plugin detects Button.tsx but no skins
⚠️  Component "Button" found but no skins detected.

Expected files:
  ✓ Button.tsx (found)
  ✗ Button.skin.ts (missing - default skin)

To create default skin:
  1. Create: src/components/button/Button.skin.ts
  2. Export CSS string: export default `...`

Or disable shadow component:
  Add /** @no-shadow */ directive to Button.tsx
```

#### 2. Debug Mode

```typescript
// vite.config.ts
shadowComponents({
  debug: true  // Logs all transformations
})

// Console output:
// [shadow-components] Discovered:
//   Button.tsx → button
//     ├─ default: Button.skin.ts
//     ├─ dark: Button.dark.ts
//     └─ material: Button.material.ts
// [shadow-components] Transformed: Button.tsx
```

#### 3. Generated Documentation

```typescript
// Plugin generates docs/shadow-components.md
# Shadow Components

## Button
- **Element:** `<button>`
- **Source:** `src/components/button/Button.tsx`
- **Skins:**
  - `default` - Default button style
  - `dark` - Dark mode variant
  - `material` - Material Design style
- **Parts:**
  - `surface` - Button surface
  - `label` - Button label text
```

#### 4. TypeScript Integration

```typescript
// Plugin generates types automatically
import type { ButtonSkinName } from '@my-lib/generated'

// Autocomplete works!
<Button skin="dark" />
//          ^--- Autocomplete: 'default' | 'dark' | 'material'
```

---

## Comparison with Other APIs

### Side-by-Side: Same Component

#### createShadowComponent

```typescript
import { createShadowComponent } from '@my-lib/react'

export const Button = createShadowComponent<ButtonProps>({
  name: 'button',
  skins: {
    default: () => import('./Button.skin'),
    dark: () => import('./Button.dark'),
  },
  render: ({ children }) => <button>{children}</button>
})
```

**Lines of code:** 9 lines

#### Vite Plugin

```typescript
export const Button = ({ children }) => <button>{children}</button>
```

**Lines of code:** 1 line

**Reduction: 89% less code!**

---

## Real-World Example

### File Structure

```
src/
├── components/
│   ├── button/
│   │   ├── Button.tsx
│   │   ├── Button.skin.ts       # Default
│   │   ├── Button.dark.ts       # Dark variant
│   │   └── Button.material.ts   # Material variant
│   │
│   ├── card/
│   │   ├── Card.tsx
│   │   ├── Card.light.ts
│   │   └── Card.dark.ts
│   │
│   └── input/
│       ├── Input.tsx
│       └── Input.skin.ts
│
└── vite.config.ts
```

### Button Component

```typescript
// src/components/button/Button.tsx

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  children: React.ReactNode
}

/**
 * Button component
 *
 * @shadow-component
 * @default-skin material
 */
export const Button = ({
  variant = 'primary',
  disabled = false,
  children
}: ButtonProps) => (
  <button
    part="surface"
    variant={variant}
    aria-disabled={disabled}
    disabled={disabled}
  >
    <span part="label">{children}</span>
  </button>
)
```

### Skin Files

```typescript
// Button.skin.ts (default)
import { COLORS, SPACING } from '@/tokens'

export default `
  [part="surface"][variant="primary"] {
    background: ${COLORS.primary};
    color: white;
    padding: ${SPACING.md} ${SPACING.lg};
  }
`
```

```typescript
// Button.dark.ts
import { COLORS, SPACING } from '@/tokens'

export default `
  [part="surface"][variant="primary"] {
    background: ${COLORS.darkPrimary};
    color: ${COLORS.darkText};
    padding: ${SPACING.md} ${SPACING.lg};
  }
`
```

### Usage

```typescript
// app.tsx

import { Button } from '@/components/button/Button'

function App() {
  return (
    <>
      <Button skin="material" variant="primary">Material</Button>
      <Button skin="dark" variant="primary">Dark</Button>
    </>
  )
}
```

**Plugin automatically:**
- ✅ Wraps Button with shadow component
- ✅ Loads skins lazily
- ✅ Generates TypeScript types
- ✅ Provides skin autocomplete

---

## Hybrid Approach: Plugin + Runtime API

**Best of both worlds:**

```typescript
// Most components: Convention (zero code)
export const Button = ({ children }) => <button>{children}</button>

// Complex cases: Explicit API
export const AdvancedButton = createShadowComponent({
  name: 'advanced-button',
  skins: { /* custom config */ },
  render: () => { /* complex logic */ }
})
```

**Plugin config:**

```typescript
shadowComponents({
  // Auto-detect most components
  autoDetect: true,

  // Ignore components using explicit API
  exclude: ['**/Advanced*.tsx'],
})
```

---

## Adoption Metrics

### Friction Score (Lower is Better)

| Metric | Plugin API | createShadowComponent | HOC | Hook |
|--------|-----------|----------------------|-----|------|
| **Lines of code** | 1 | 9 | 7 | 12 |
| **Imports needed** | 0 | 1 | 1 | 2 |
| **New concepts** | 1 | 2 | 1 | 3 |
| **Setup complexity** | Medium | Low | Low | Low |
| **Migration effort** | Zero | Low | Low | Medium |

**Plugin API wins on code/concepts, but loses on setup.**

---

## When to Use Plugin API

### ✅ Use Plugin When:

1. **New project**
   - Can establish conventions from start
   - Vite is already in stack
   - Team values minimal boilerplate

2. **Large codebase**
   - Many components to migrate
   - Want consistency across codebase
   - Zero per-component changes

3. **Team prefers conventions**
   - Like Next.js file-based routing
   - Prefer configuration over code
   - Value implicit over explicit

### ❌ Avoid Plugin When:

1. **Not using Vite**
   - Webpack/Parcel/etc. (though could port)
   - Create React App without ejecting
   - Custom build setup

2. **Need maximum control**
   - Complex per-component logic
   - Dynamic configuration
   - Runtime decisions

3. **Team prefers explicit**
   - Want to see all configuration
   - Dislike "magic"
   - Prefer imports/wrappers

---

## Recommendation

### Ship Plugin as Optional Enhancement

```typescript
// Core library works standalone
import { createShadowComponent } from '@my-lib/react'

// Plugin is optional enhancement
import { shadowComponents } from '@my-lib/vite-plugin'
```

**Migration path:**

1. **Start:** Use `createShadowComponent` (explicit, clear)
2. **Scale:** Add plugin for new components (reduce boilerplate)
3. **Optimize:** Migrate existing to conventions (if desired)

**Messaging:**
- "Use the API directly for full control"
- "Use the plugin for zero-boilerplate experience"
- "Mix and match as needed"

---

## Final Comparison Matrix

| Factor | Plugin | createShadowComponent | HOC | Hook | Macro |
|--------|--------|----------------------|-----|------|-------|
| **Code reduction** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Adoption** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Resistance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Flexibility** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Setup** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Debugging** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

**Best for:**
- **Plugin:** Large codebases, new projects, convention lovers
- **createShadowComponent:** Default choice, good balance
- **HOC:** Migrating existing codebases
- **Hook:** Maximum flexibility needs
- **Macro:** Performance enthusiasts (later)

---

**Status:** Vite plugin API designed with adoption analysis.
**Recommendation:** Offer as optional enhancement to core APIs.
