# CSS-in-TypeScript: Compile-Time CSS with Ecosystem Access

**Version:** 0.1
**Date:** 2025-12-27
**Status:** Core Architecture Pattern

---

## The Approach

**CSS is defined in `.ts` files that export CSS strings, not in `.css` files.**

This is **NOT** runtime CSS-in-JS (styled-components, emotion). This is **compile-time CSS-in-TS** that:
- Outputs plain CSS strings
- Has zero runtime overhead
- Leverages the entire TypeScript/JavaScript ecosystem
- Enables code sharing and composition

---

## Current Implementation Pattern

### Skin Definition (`.ts` file)

```typescript
// components/button/skins/material.ts
export default `
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  [part="surface"] {
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
  }

  [part="surface"]:hover {
    background: #1976d2;
  }
`
```

### Component Integration

```typescript
// components/button/index.tsx
export const SKINS = {
  material: () => import('./skins/material'),
  dark: () => import('./skins/dark'),
} as const satisfies Record<string, () => Promise<{ default: string }>>

// Load and create CSSStyleSheet
const { default: cssString } = await import('./skins/material')
const sheet = new CSSStyleSheet()
await sheet.replace(cssString)  // Convert string → CSSOM
```

**Key insight:** The `.ts` file exports a **string**, which is then converted to a CSSStyleSheet at runtime via `replace()`.

---

## The Power: Full Ecosystem Access

### 1. **Import Shared Constants**

```typescript
// design-system/tokens.ts
export const COLORS = {
  primary: '#2196f3',
  primaryHover: '#1976d2',
  secondary: '#757575',
  danger: '#f44336',
} as const

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const

export const SHADOWS = {
  sm: '0 1px 3px rgba(0,0,0,0.12)',
  md: '0 4px 6px rgba(0,0,0,0.16)',
  lg: '0 10px 20px rgba(0,0,0,0.19)',
} as const
```

```typescript
// components/button/skins/material.ts
import { COLORS, SPACING, SHADOWS } from '../../../design-system/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.primary};
    padding: ${SPACING.md} ${SPACING.lg};
    box-shadow: ${SHADOWS.md};
  }

  [part="surface"]:hover {
    background: ${COLORS.primaryHover};
    box-shadow: ${SHADOWS.lg};
  }
`
```

**Benefits:**
- ✅ Single source of truth for design tokens
- ✅ Type-safe (TypeScript validates token names)
- ✅ Refactor-friendly (rename propagates everywhere)
- ✅ Import from any file in your codebase

---

### 2. **Import Helper Functions**

```typescript
// design-system/helpers.ts
export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function darken(hex: string, percent: number): string {
  // ... implementation
}

export function createGradient(start: string, end: string, angle = 135): string {
  return `linear-gradient(${angle}deg, ${start}, ${end})`
}

export function spacing(multiplier: number, base = 8): string {
  return `${multiplier * base}px`
}
```

```typescript
// components/card/skins/material.ts
import { COLORS } from '../../../design-system/tokens'
import { rgba, createGradient, spacing } from '../../../design-system/helpers'

export default `
  [part="container"] {
    background: ${createGradient(COLORS.primary, COLORS.primaryHover)};
    padding: ${spacing(2)};
    box-shadow: 0 2px 4px ${rgba(COLORS.primary, 0.3)};
  }
`
```

**Benefits:**
- ✅ Reusable CSS logic
- ✅ Type-safe functions
- ✅ Consistent transformations across skins

---

### 3. **Import from 3rd Party Libraries**

```typescript
// npm install polished
import { darken, lighten, transparentize, rem } from 'polished'

// components/button/skins/material.ts
import { darken, lighten, transparentize, rem } from 'polished'
import { COLORS } from '../../../design-system/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.primary};
    padding: ${rem(12)} ${rem(24)};
    border: 1px solid ${darken(0.1, COLORS.primary)};
  }

  [part="surface"]:hover {
    background: ${lighten(0.05, COLORS.primary)};
  }

  [part="surface"]:active {
    box-shadow: inset 0 2px 4px ${transparentize(0.7, COLORS.primary)};
  }
`
```

**Popular libraries you can use:**
- [polished](https://polished.js.org/) - Color manipulation, mixins
- [color](https://github.com/Qix-/color) - Color conversions
- [csstype](https://github.com/frenic/csstype) - TypeScript CSS types
- Any utility library (lodash, ramda, etc.)

---

### 4. **Share Base Styles Between Skins**

```typescript
// components/button/base.ts
import { SPACING } from '../../design-system/tokens'

export const baseButtonStyles = `
  [part="surface"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${SPACING.sm};
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.5;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  [part="surface"]:disabled,
  [part="surface"][aria-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`
```

```typescript
// components/button/skins/material.ts
import { baseButtonStyles } from '../base'
import { COLORS, SPACING } from '../../../design-system/tokens'

export default `
  ${baseButtonStyles}

  [part="surface"] {
    background: ${COLORS.primary};
    color: white;
    padding: ${SPACING.md} ${SPACING.lg};
    border-radius: 4px;
  }
`
```

```typescript
// components/button/skins/brutalist.ts
import { baseButtonStyles } from '../base'
import { COLORS, SPACING } from '../../../design-system/tokens'

export default `
  ${baseButtonStyles}

  [part="surface"] {
    background: yellow;
    color: black;
    padding: ${SPACING.lg} ${SPACING.xl};
    border: 4px solid black;
    border-radius: 0;
    box-shadow: 8px 8px 0 black;
  }
`
```

**Benefits:**
- ✅ DRY (Don't Repeat Yourself)
- ✅ Consistent base behavior across skins
- ✅ Easy to update shared logic

---

### 5. **Conditional Logic and Composition**

```typescript
// design-system/breakpoints.ts
export const BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
} as const

export function mediaQuery(breakpoint: keyof typeof BREAKPOINTS) {
  return `@media (min-width: ${BREAKPOINTS[breakpoint]})`
}
```

```typescript
// components/card/skins/responsive.ts
import { COLORS, SPACING } from '../../../design-system/tokens'
import { mediaQuery } from '../../../design-system/breakpoints'

const mobileStyles = `
  [part="container"] {
    padding: ${SPACING.sm};
    flex-direction: column;
  }
`

const desktopStyles = `
  [part="container"] {
    padding: ${SPACING.xl};
    flex-direction: row;
    gap: ${SPACING.lg};
  }
`

export default `
  [part="container"] {
    display: flex;
    background: ${COLORS.surface};
  }

  ${mobileStyles}

  ${mediaQuery('desktop')} {
    ${desktopStyles}
  }
`
```

---

### 6. **Feature Flags and Environment-Based Styles**

```typescript
// components/debug-panel/skins/default.ts
const IS_DEV = process.env.NODE_ENV === 'development'
const SHOW_DEBUG = process.env.VITE_SHOW_DEBUG === 'true'

const debugStyles = IS_DEV || SHOW_DEBUG ? `
  [part="debug-info"] {
    display: block;
    position: fixed;
    bottom: 0;
    right: 0;
    background: rgba(0,0,0,0.9);
    color: lime;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.75rem;
  }
` : `
  [part="debug-info"] {
    display: none;
  }
`

export default debugStyles
```

---

### 7. **Generate Styles Programmatically**

```typescript
// components/gradient-picker/skins/rainbow.ts
import { COLORS } from '../../../design-system/tokens'

// Generate color stops programmatically
const colorStops = Object.values(COLORS)
  .map((color, index, arr) => {
    const percentage = (index / (arr.length - 1)) * 100
    return `${color} ${percentage}%`
  })
  .join(', ')

export default `
  [part="gradient-bg"] {
    background: linear-gradient(90deg, ${colorStops});
  }
`
```

**Another example: Generate grid styles**

```typescript
// components/grid/skins/auto-grid.ts
function generateGrid(columns: number, gap: string) {
  return `
    [part="container"] {
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: ${gap};
    }
  `
}

export default generateGrid(12, '1rem')
```

---

## Comparison: CSS-in-TS vs Alternatives

| Approach | Runtime Cost | Ecosystem Access | Type Safety | Code Splitting | DX |
|----------|-------------|------------------|-------------|----------------|-----|
| **Plain CSS** | ✅ Zero | ❌ No | ❌ No | ⚠️ Manual | ⚠️ Separate files |
| **CSS Modules** | ✅ Zero | ❌ No | ⚠️ Limited | ✅ Yes | ✅ Good |
| **Sass/SCSS** | ✅ Zero (compiled) | ⚠️ Sass only | ❌ No | ⚠️ Manual | ✅ Good |
| **styled-components** | ❌ Runtime | ✅ Full JS | ✅ Yes | ✅ Yes | ⚠️ Runtime cost |
| **Emotion** | ❌ Runtime | ✅ Full JS | ✅ Yes | ✅ Yes | ⚠️ Runtime cost |
| **CSS-in-TS (Your approach)** | ✅ Zero | ✅ Full TS/JS | ✅ Yes | ✅ Yes | ✅ Excellent |

---

## Advanced Patterns

### Pattern 1: Skin Variants with Shared Logic

```typescript
// components/button/skins/generator.ts
import { COLORS, SPACING } from '../../../design-system/tokens'

export function createMaterialSkin(primaryColor: string) {
  return `
    [part="surface"] {
      background: ${primaryColor};
      color: white;
      padding: ${SPACING.md} ${SPACING.lg};
      border-radius: 4px;
      border: none;
    }

    [part="surface"]:hover {
      filter: brightness(0.9);
    }
  `
}

// components/button/skins/material-blue.ts
import { createMaterialSkin } from './generator'
import { COLORS } from '../../../design-system/tokens'

export default createMaterialSkin(COLORS.primary)

// components/button/skins/material-red.ts
import { createMaterialSkin } from './generator'
import { COLORS } from '../../../design-system/tokens'

export default createMaterialSkin(COLORS.danger)
```

---

### Pattern 2: CSS-in-TS with CSS Layers

```typescript
// components/card/skins/layered.ts
import { baseStyles } from '../base'
import { COLORS } from '../../../design-system/tokens'

export default `
  @layer base, theme, variants;

  @layer base {
    ${baseStyles}
  }

  @layer theme {
    [part="container"] {
      background: ${COLORS.surface};
      color: ${COLORS.onSurface};
    }
  }

  @layer variants {
    [part="container"][variant="elevated"] {
      box-shadow: 0 4px 8px rgba(0,0,0,0.16);
    }

    [part="container"][variant="outlined"] {
      border: 1px solid ${COLORS.outline};
    }
  }
`
```

---

### Pattern 3: Import CSS from Node Modules

```typescript
// components/code-editor/skins/default.ts
import { SPACING } from '../../../design-system/tokens'

// Import CSS from a library (e.g., highlight.js)
// Note: In production, you'd use a bundler plugin to handle this
// For now, inline the critical styles

const syntaxHighlightCSS = `
  .hljs-keyword { color: #c678dd; }
  .hljs-string { color: #98c379; }
  .hljs-comment { color: #5c6370; font-style: italic; }
`

export default `
  [part="editor"] {
    font-family: 'Monaco', 'Courier New', monospace;
    padding: ${SPACING.lg};
    background: #282c34;
    color: #abb2bf;
    overflow: auto;
  }

  ${syntaxHighlightCSS}
`
```

---

### Pattern 4: Design Token System

```typescript
// design-system/tokens/colors.ts
export const LIGHT_COLORS = {
  primary: '#2196f3',
  surface: '#ffffff',
  onSurface: '#000000',
  outline: '#e0e0e0',
} as const

export const DARK_COLORS = {
  primary: '#90caf9',
  surface: '#121212',
  onSurface: '#ffffff',
  outline: '#2d2d2d',
} as const

// design-system/tokens/index.ts
export { LIGHT_COLORS, DARK_COLORS }
export * from './spacing'
export * from './typography'
export * from './shadows'

// components/card/skins/light.ts
import { LIGHT_COLORS as COLORS } from '../../../design-system/tokens'

export default `
  [part="container"] {
    background: ${COLORS.surface};
    color: ${COLORS.onSurface};
    border: 1px solid ${COLORS.outline};
  }
`

// components/card/skins/dark.ts
import { DARK_COLORS as COLORS } from '../../../design-system/tokens'

export default `
  [part="container"] {
    background: ${COLORS.surface};
    color: ${COLORS.onSurface};
    border: 1px solid ${COLORS.outline};
  }
`
```

---

## Type Safety

### Type-Safe Token Access

```typescript
// design-system/tokens.ts
export const COLORS = {
  primary: '#2196f3',
  secondary: '#757575',
  danger: '#f44336',
} as const

export type ColorKey = keyof typeof COLORS

// Helper with type safety
export function getColor(key: ColorKey): string {
  return COLORS[key]
}

// components/button/skins/typed.ts
import { getColor, type ColorKey } from '../../../design-system/tokens'

function createButtonSkin(color: ColorKey) {
  return `
    [part="surface"] {
      background: ${getColor(color)};
    }
  `
}

export default createButtonSkin('primary')  // ✅ Type-safe
// createButtonSkin('invalid')              // ❌ TypeScript error
```

---

### Type-Safe CSS Properties

```typescript
// design-system/css-helpers.ts
import type { Property } from 'csstype'

export function backgroundColor(value: Property.BackgroundColor): string {
  return `background-color: ${value};`
}

export function padding(value: Property.Padding): string {
  return `padding: ${value};`
}

// components/box/skins/typed.ts
import { backgroundColor, padding } from '../../../design-system/css-helpers'

export default `
  [part="container"] {
    ${backgroundColor('#ffffff')}     // ✅ Valid CSS color
    ${padding('1rem 2rem')}            // ✅ Valid padding
    ${backgroundColor('invalid')}      // ❌ TypeScript error
  }
`
```

---

## Build-Time Optimizations

### Static Analysis

Because CSS is defined in TypeScript:
- ✅ Linters can analyze CSS (stylelint via plugins)
- ✅ Dead code elimination (unused exports removed)
- ✅ Tree shaking (only imported skins bundled)
- ✅ Type checking (invalid tokens caught at compile-time)

### Bundle Optimization

```typescript
// Your library can analyze imports and optimize
import { COLORS } from '../../../design-system/tokens'  // Only COLORS imported

// Not this:
import * as Tokens from '../../../design-system/tokens'  // Everything imported

// Bundler sees: only COLORS used → tree-shake the rest
```

---

## Migration from Current Approach

### Current (from your sandbox)

```typescript
// style.ts
export default `
  button {
    background-color: #000;
    color: #fff;
    padding: 0.5rem;
  }
`
```

**Works perfectly!** No changes needed for simple cases.

### Enhanced (with imports)

```typescript
// style.ts
import { COLORS, SPACING } from '../../design-system/tokens'

export default `
  button {
    background-color: ${COLORS.dark};
    color: ${COLORS.light};
    padding: ${SPACING.md};
  }
`
```

**Progressive enhancement:** Start simple, add imports as needed.

---

## Recommended File Structure

```
src/
├── design-system/
│   ├── tokens/
│   │   ├── index.ts          # Re-export all tokens
│   │   ├── colors.ts         # Color constants
│   │   ├── spacing.ts        # Spacing scale
│   │   ├── typography.ts     # Font stacks, sizes
│   │   └── shadows.ts        # Elevation system
│   ├── helpers/
│   │   ├── index.ts
│   │   ├── colors.ts         # Color manipulation
│   │   ├── layout.ts         # Layout utilities
│   │   └── responsive.ts     # Media query helpers
│   └── base/
│       ├── reset.ts          # CSS reset
│       ├── typography.ts     # Base typography
│       └── layout.ts         # Base layout styles
│
├── components/
│   ├── button/
│   │   ├── index.tsx
│   │   ├── base.ts           # Shared base styles
│   │   └── skins/
│   │       ├── material.ts   # Material Design skin
│   │       ├── brutalist.ts  # Brutalist skin
│   │       └── glass.ts      # Glassmorphism skin
│   │
│   └── card/
│       ├── index.tsx
│       ├── base.ts
│       └── skins/
│           ├── light.ts
│           └── dark.ts
```

---

## Vite Plugin Integration

Your library's Vite plugin can enhance this:

```typescript
// vite-plugin-shadow-css.ts
export function shadowCSS() {
  return {
    name: 'vite-plugin-shadow-css',

    transform(code: string, id: string) {
      // Detect CSS-in-TS files
      if (id.endsWith('/skins/') || id.includes('/base.ts')) {
        // Could add:
        // - PostCSS processing
        // - Autoprefixer
        // - Minification
        // - CSS validation
      }
      return null
    },

    // Extract skin metadata for type generation
    buildStart() {
      // Scan all skin files
      // Generate types for skin names
    }
  }
}
```

---

## Real-World Example

### Complete Button Component

```typescript
// design-system/tokens.ts
export const COLORS = {
  primary: '#2196f3',
  primaryHover: '#1976d2',
  danger: '#f44336',
  dangerHover: '#d32f2f',
} as const

export const SPACING = {
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
} as const

// design-system/helpers.ts
import { COLORS } from './tokens'

export function getColorPair(variant: 'primary' | 'danger') {
  const pairs = {
    primary: { base: COLORS.primary, hover: COLORS.primaryHover },
    danger: { base: COLORS.danger, hover: COLORS.dangerHover },
  }
  return pairs[variant]
}

// components/button/base.ts
import { SPACING } from '../../design-system/tokens'

export const baseButtonStyles = `
  [part="surface"] {
    display: inline-flex;
    align-items: center;
    gap: ${SPACING.sm};
    font-family: inherit;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  [part="surface"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

// components/button/skins/material.ts
import { baseButtonStyles } from '../base'
import { getColorPair } from '../../../design-system/helpers'
import { SPACING } from '../../../design-system/tokens'

const primaryColors = getColorPair('primary')

export default `
  ${baseButtonStyles}

  [part="surface"][variant="primary"] {
    background: ${primaryColors.base};
    color: white;
    padding: ${SPACING.md} ${SPACING.lg};
    border-radius: 4px;
  }

  [part="surface"][variant="primary"]:hover:not(:disabled) {
    background: ${primaryColors.hover};
  }
`

// components/button/index.tsx
export const SKINS = {
  material: () => import('./skins/material'),
  brutalist: () => import('./skins/brutalist'),
} as const

// Usage maintains all previous patterns
```

---

## Benefits Summary

### What You Get

1. **Full TypeScript/JavaScript ecosystem**
   - Import any npm package
   - Use any JavaScript utility
   - Share code across your entire codebase

2. **Type safety**
   - Tokens are typed
   - Helpers are typed
   - Invalid references caught at compile-time

3. **Zero runtime cost**
   - Everything compiles to plain CSS strings
   - No JavaScript execution at runtime
   - Same performance as hand-written CSS

4. **Code reuse**
   - Share tokens across all skins
   - Share helpers across all components
   - DRY principles applied to CSS

5. **Excellent DX**
   - Autocomplete for tokens
   - Jump to definition
   - Refactoring support
   - All your IDE features work

6. **Build-time optimization**
   - Tree shaking
   - Dead code elimination
   - Type checking
   - Linting

---

## Conclusion

**CSS-in-TypeScript (not CSS-in-JS) is the perfect fit for your architecture:**

- ✅ Enables the entire ecosystem (imports, packages, helpers)
- ✅ Zero runtime cost (compiles to strings)
- ✅ Type-safe design tokens and utilities
- ✅ Works with Constructable Stylesheets perfectly
- ✅ Enables code sharing and DRY
- ✅ Excellent developer experience

**Combined with:**
- Skins (complete visual freedom)
- Attribute-driven styling (accessibility baked in)
- Constructable Stylesheets (performance)
- Lazy loading (code splitting)

**You have a truly unique and powerful architecture.**

---

**Status:** CSS-in-TypeScript approach documented.
**Next:** Update all previous docs to reflect this implementation detail.
