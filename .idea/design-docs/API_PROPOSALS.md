# API Proposals: Ergonomics & Adoption Analysis

**Version:** 0.2
**Date:** 2025-12-27
**Focus:** Developer experience, adoption, and resistance minimization
**Updated:** Added Vite Plugin API (Flavor 5)

---

## Evaluation Criteria

Each API will be evaluated on:

1. **Adoption Factors** ✅
   - Familiarity (looks like what devs know)
   - Progressive enhancement (can adopt incrementally)
   - Low ceremony (minimal boilerplate)
   - Clear value proposition

2. **Resistance Factors** ⚠️
   - Learning curve
   - Migration effort
   - Mental model shift required
   - Breaking existing patterns

3. **DX Factors** 💡
   - TypeScript support
   - Autocomplete quality
   - Error messages
   - Debugging experience

---

## API Flavor 1: `createShadowComponent` (Factory Function)

### Basic Usage

```typescript
// components/Button.tsx
import { createShadowComponent } from '@my-lib/react'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export const Button = createShadowComponent<ButtonProps>({
  name: 'button',

  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  },

  render: ({ variant = 'primary', children }) => (
    <button part="surface" variant={variant}>
      <span part="label">{children}</span>
    </button>
  )
})

// Usage with Provider (REQUIRED)
import { SkinProvider } from '@my-lib/react'

<SkinProvider skin="material">
  <Button variant="primary">Click Me</Button>
  <Button variant="secondary">Cancel</Button>
</SkinProvider>

// Override via nested provider (not component props!)
<SkinProvider skin="material">
  <Button variant="primary">Normal</Button>

  <SkinProvider skin="brutalist">
    <Button variant="primary">Different skin!</Button>
  </SkinProvider>
</SkinProvider>
```

### Advanced Usage (with base styles)

```typescript
export const Card = createShadowComponent<CardProps>({
  name: 'card',

  // Optional: base styles loaded eagerly
  base: () => import('./base'),

  skins: {
    light: () => import('./skins/light'),
    dark: () => import('./skins/dark'),
  },

  // Optional: default skin
  defaultSkin: 'light',

  render: ({ title, children }) => (
    <article part="container">
      <h2 part="title">{title}</h2>
      <div part="content">{children}</div>
    </article>
  )
})
```

### Adoption Analysis

**✅ Familiarity:**
- Looks similar to styled-components `styled.div` or Emotion's `styled()`
- Factory function pattern is well-known in React ecosystem
- Clear input → output (config → component)

**✅ Progressive Enhancement:**
```typescript
// Start simple
export const Button = createShadowComponent({
  name: 'button',
  skins: { default: () => import('./style') },
  render: ({ children }) => <button>{children}</button>
})

// Add more later
export const Button = createShadowComponent({
  name: 'button',
  base: () => import('./base'),           // Add base
  skins: {                                // Add more skins
    material: () => import('./material'),
    brutalist: () => import('./brutalist'),
  },
  defaultSkin: 'material',                // Add default
  render: ({ children }) => <button>{children}</button>
})
```

**✅ Low Ceremony:**
- Single function call
- All config in one place
- No need to define custom element separately

**⚠️ Resistance Points:**

1. **New pattern to learn**
   - Not exactly like styled-components (no template literals)
   - Need to understand `render` function concept

2. **Mental model shift**
   - Component + styles are separate (render + skins)
   - May feel "more complex" initially

**Mitigation:**
- Provide codemod from styled-components
- Show side-by-side comparisons in docs
- Emphasize: "Like styled-components, but..."

---

## API Flavor 2: HOC (Higher-Order Component)

### Basic Usage

```typescript
// components/Button.tsx
import { withShadowStyles } from '@my-lib/react'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

// Define component normally
const ButtonBase = ({ variant = 'primary', children }: ButtonProps) => (
  <button part="surface" variant={variant}>
    <span part="label">{children}</span>
  </button>
)

// Wrap with HOC
export const Button = withShadowStyles(ButtonBase, {
  name: 'button',
  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  }
})

// Usage with Provider (REQUIRED)
import { SkinProvider } from '@my-lib/react'

<SkinProvider skin="material">
  <Button variant="primary">Click Me</Button>
  <Button variant="secondary">Cancel</Button>
</SkinProvider>

// Override via nested provider (not component props!)
<SkinProvider skin="material">
  <Button variant="primary">Normal</Button>

  <SkinProvider skin="brutalist">
    <Button>Different skin!</Button>
  </SkinProvider>
</SkinProvider>
```

### Advanced Usage (with configuration)

```typescript
// Inline definition
export const Card = withShadowStyles(
  ({ title, children }: CardProps) => (
    <article part="container">
      <h2 part="title">{title}</h2>
      <div part="content">{children}</div>
    </article>
  ),
  {
    name: 'card',
    base: () => import('./base'),
    skins: {
      light: () => import('./skins/light'),
      dark: () => import('./skins/dark'),
    },
    defaultSkin: 'light'
  }
)

// Or separate definition (for reuse/testing)
const CardBase = ({ title, children }: CardProps) => (
  <article part="container">
    <h2 part="title">{title}</h2>
    <div part="content">{children}</div>
  </article>
)

export const Card = withShadowStyles(CardBase, {
  name: 'card',
  skins: { /* ... */ }
})
```

### Adoption Analysis

**✅ Familiarity:**
- HOC pattern is extremely well-known in React
- Similar to `withRouter`, `connect`, `memo`, etc.
- React developers already understand this pattern

**✅ Progressive Enhancement:**
```typescript
// Start with plain component
const Button = ({ children }) => <button>{children}</button>

// Add shadow styles later
export default withShadowStyles(Button, {
  name: 'button',
  skins: { default: () => import('./style') }
})

// No need to refactor component code!
```

**✅ Separation of Concerns:**
- Component logic is pure (no styling concerns)
- Can test ButtonBase without shadow DOM complexity
- Can use ButtonBase in different contexts

**⚠️ Resistance Points:**

1. **HOC reputation**
   - HOCs somewhat "old school" (hooks are preferred now)
   - Potential confusion with HOC composition

2. **Type inference**
   - May need explicit generics for TypeScript
   - Props flow can be tricky

3. **Debugging**
   - Extra component in React DevTools

**Mitigation:**
- Emphasize: "HOC for styling, not logic"
- Provide excellent TypeScript support
- Show that it composes well with hooks

---

## API Flavor 3: Hook-Based

### Basic Usage (useShadowStyles)

```typescript
// components/Button.tsx
import { useShadowStyles, useSkinContext } from '@my-lib/react'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  // No skin prop! Skin comes from context
}

const skins = {
  material: () => import('./skins/material'),
  brutalist: () => import('./skins/brutalist'),
}

export const Button = ({ variant = 'primary', children, ...props }: ButtonProps) => {
  const skin = useSkinContext() // Read from Provider (internal)

  const { ref } = useShadowStyles('button', skins, skin)

  return (
    <shadow-root ref={ref} exportparts="surface,label">
      <button part="surface" variant={variant} {...props}>
        <span part="label">{children}</span>
      </button>
    </shadow-root>
  )
}

// Usage with Provider (REQUIRED)
import { SkinProvider } from '@my-lib/react'

<SkinProvider skin="material">
  <Button variant="primary">Click Me</Button>
  <Button variant="secondary">Cancel</Button>
</SkinProvider>

// Override via nested provider (not component props!)
<SkinProvider skin="material">
  <Button>Normal</Button>

  <SkinProvider skin="brutalist">
    <Button>Different skin!</Button>
  </SkinProvider>
</SkinProvider>
```

### Advanced Usage (with ShadowRoot component)

```typescript
import { ShadowRoot, useSkin } from '@my-lib/react'

const skins = {
  material: () => import('./skins/material'),
  brutalist: () => import('./skins/brutalist'),
}

export const Button = ({ variant = 'primary', children }: ButtonProps) => {
  // Hook manages skin state
  const skin = useSkin('material')

  return (
    <ShadowRoot
      name="button"
      skin={skin}
      skins={skins}
      parts={['surface', 'label']}
    >
      <button part="surface" variant={variant}>
        <span part="label">{children}</span>
      </button>
    </ShadowRoot>
  )
}
```

### Adoption Analysis

**✅ Familiarity:**
- Hooks are the **preferred** React pattern (2025)
- Feels natural to React developers
- Similar to `useState`, `useRef`, etc.

**✅ Flexibility:**
- Can compose with other hooks easily
- Full control over component structure
- Easy to add conditional logic

**✅ No Wrapping:**
- Direct component definition
- Clear component tree in DevTools
- No HOC overhead

**⚠️ Resistance Points:**

1. **More boilerplate**
   - Need to define skins separately
   - Need to wire up ref manually
   - More code to write

2. **Shadow DOM concerns**
   - `<shadow-root>` might look weird
   - Need to understand ref forwarding

3. **Coupling**
   - Styles defined in component file (or imported)
   - Can't easily separate for testing

**Mitigation:**
- Provide ShadowRoot component (reduces boilerplate)
- Show that flexibility is worth it
- Provide helper components for common patterns

---

## API Flavor 4: Decorator/Macro (Build-Time)

### Babel Macro Approach

```typescript
// components/Button.tsx
import { shadow } from '@my-lib/react.macro'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

// Macro transforms this at build-time
export const Button = shadow<ButtonProps>('button', {
  skins: {
    material: './skins/material',  // No dynamic import needed!
    brutalist: './skins/brutalist',
  }
})(({ variant = 'primary', children }) => (
  <button part="surface" variant={variant}>
    <span part="label">{children}</span>
  </button>
))

// Expands to full custom element + React wrapper at build-time
```

### TypeScript Decorator Approach (Experimental)

```typescript
// components/Button.tsx
import { ShadowComponent } from '@my-lib/react'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

@ShadowComponent({
  name: 'button',
  skins: {
    material: './skins/material',
    brutalist: './skins/brutalist',
  }
})
export class Button extends React.Component<ButtonProps> {
  render() {
    const { variant = 'primary', children } = this.props
    return (
      <button part="surface" variant={variant}>
        <span part="label">{children}</span>
      </button>
    )
  }
}
```

### Adoption Analysis

**✅ Zero Runtime:**
- Everything compiled away at build-time
- Maximum performance
- No library runtime overhead

**✅ Clean Syntax:**
- Looks like magic (in a good way)
- Very little boilerplate
- Decorator feels "official"

**⚠️ Resistance Points:**

1. **Build-time dependency**
   - Requires Babel or SWC plugin
   - Adds complexity to setup
   - Not portable (can't copy-paste to different project easily)

2. **Debugging complexity**
   - Generated code is hidden
   - Source maps can be tricky
   - Error messages may be cryptic

3. **Ecosystem maturity**
   - Babel macros are declining in usage
   - TS decorators still experimental
   - May break with tooling updates

**Mitigation:**
- Make macro optional (provide runtime alternative)
- Excellent error messages from macro
- Clear documentation on setup

---

## API Flavor 5: Vite Plugin (Convention-Based)

### Basic Usage

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { shadowComponents } from '@my-lib/vite-plugin'

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

```typescript
// components/Button/Button.tsx
// Just write a normal React component!
// The plugin auto-wires it to read skin from context
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  // No skin prop! Plugin handles context internally
}

export const Button = ({ variant = 'primary', children }: ButtonProps) => (
  <button part="surface" variant={variant}>
    <span part="label">{children}</span>
  </button>
)
```

```typescript
// components/Button/Button.skin.ts
// Convention: *.skin.ts is the default skin
import { COLORS } from '@/design-system/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.primary};
    padding: 1rem 2rem;
    border-radius: 4px;
  }
`
```

```typescript
// components/Button/Button.dark.ts
// Convention: *.dark.ts is a variant skin
export default `
  [part="surface"] {
    background: #1a1a1a;
    color: white;
  }
`
```

**Plugin auto-generates:**

```typescript
// This is what the plugin outputs (you don't write this!)
import { createShadowComponent, useSkinContext } from '@my-lib/react'

const ButtonBase = ({ variant = 'primary', children }: ButtonProps) => {
  const skin = useSkinContext() // Plugin adds this internally
  // Component uses context skin (no prop!)
  return (
    <button part="surface" variant={variant}>
      <span part="label">{children}</span>
    </button>
  )
}

export const Button = createShadowComponent({
  name: 'button',
  skins: {
    default: () => import('./Button.skin'),
    dark: () => import('./Button.dark'),
  },
  render: ButtonBase
})
```

**Usage with Provider (REQUIRED):**

```typescript
import { SkinProvider } from '@my-lib/react'

<SkinProvider skin="default">
  <Button variant="primary">Click Me</Button>
  <Button variant="secondary">Cancel</Button>
</SkinProvider>

// Nesting works! (override via nested providers)
<SkinProvider skin="default">
  <Button>Normal</Button>

  <SkinProvider skin="dark">
    <Button>Dark section</Button>
  </SkinProvider>

  <Button>Back to normal</Button>
</SkinProvider>

// Note: No skin prop on <Button>!
// Overrides happen via Provider nesting only
```

### Advanced Usage (with Directives)

```typescript
// components/Card/Card.tsx
/**
 * @shadow-component
 * @name custom-card
 * @default-skin light
 * @parts container,title,content
 */
export const Card = ({ title, children }: CardProps) => (
  <article part="container">
    <h2 part="title">{title}</h2>
    <div part="content">{children}</div>
  </article>
)
```

**Directive reference:**
- `@shadow-component` - Force enable (even if no skins found yet)
- `@name custom-name` - Override element name (default: lowercase component name)
- `@default-skin skinName` - Set default skin
- `@parts part1,part2` - Export parts list
- `@no-shadow` - Disable for this component (useful for exceptions)

### Adoption Analysis

**✅ Familiarity:**
- Looks like **pure React** (the component is just React!)
- Convention-based like Next.js file routing
- Similar to CSS Modules naming (`.module.css` → `.skin.ts`)
- Developers already understand file-based conventions

**✅ Zero Boilerplate:**
```typescript
// Traditional (createShadowComponent)
import { createShadowComponent } from '@my-lib/react'

export const Button = createShadowComponent<ButtonProps>({
  name: 'button',
  skins: {
    material: () => import('./skins/material'),
  },
  render: ({ children }) => <button>{children}</button>
})

// Vite Plugin (convention-based)
export const Button = ({ children }: ButtonProps) => (
  <button>{children}</button>
)
// + Button.skin.ts file

// 89% less code! (1 line vs 9 lines)
```

**✅ Progressive Enhancement:**
```typescript
// Phase 1: Start with normal component
export const Button = ({ children }) => <button>{children}</button>

// Phase 2: Add a skin file (plugin auto-detects)
// Button.skin.ts created

// Phase 3: Add more skins
// Button.dark.ts, Button.brutalist.ts created

// Component code NEVER changes!
```

**✅ Mental Model:**
- "My component is just a component"
- "Skins are separate files"
- "Plugin wires them together"
- No need to understand Shadow DOM internals

**⚠️ Resistance Points:**

1. **Build tool dependency**
   - Only works with Vite
   - Can't use with other bundlers (webpack, Rollup, etc.)
   - Adds magic/indirection

2. **Convention learning**
   - Need to learn file naming conventions
   - `*.skin.ts` vs `*.dark.ts` vs `*.{name}.ts`
   - Where should I put these files?

3. **Less explicit**
   - Plugin does wiring behind the scenes
   - May be harder to debug transformation
   - "Where is the component actually created?"

4. **IDE support**
   - TypeScript may not immediately see the transformed component
   - Need to configure types properly
   - Autocomplete for `skin` prop might lag

**Mitigation:**

1. **Provide explicit fallback**
   ```typescript
   // If you don't like the plugin, just use the API directly!
   import { createShadowComponent } from '@my-lib/react'

   // Both approaches work side-by-side
   ```

2. **Excellent error messages**
   ```
   ❌ No skins found for Button component

   Expected one of:
     - src/components/Button/Button.skin.ts
     - src/components/Button/skins/default.ts

   Or disable with: /** @no-shadow */
   ```

3. **TypeScript integration**
   ```typescript
   // Auto-generate types for transformed components
   declare module '@/components/Button' {
     export const Button: ShadowComponent<ButtonProps, 'default' | 'dark'>
   }
   ```

4. **Clear documentation**
   - Visual diagram of file structure
   - Side-by-side with explicit API
   - Migration guide

### Comparison: Explicit vs Convention

**Explicit API (createShadowComponent):**
```typescript
// ✅ Clear: Everything visible in one place
// ✅ Portable: Works without build plugin
// ❌ Verbose: More code to write
// ❌ Coupling: Styles mentioned in component

export const Button = createShadowComponent<ButtonProps>({
  name: 'button',
  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
  },
  render: ({ variant, children }) => (
    <button part="surface" variant={variant}>
      {children}
    </button>
  )
})
```

**Convention-based (Vite Plugin):**
```typescript
// ✅ Concise: Just write the component
// ✅ Separation: Skins are separate files
// ❌ Implicit: Plugin does the wiring
// ❌ Vite-only: Not portable to other bundlers

export const Button = ({ variant, children }: ButtonProps) => (
  <button part="surface" variant={variant}>
    {children}
  </button>
)

// + Button.skin.ts (auto-discovered)
// + Button.brutalist.ts (auto-discovered)
```

### File Structure Conventions

**Recommended structure:**
```
components/
├── Button/
│   ├── Button.tsx           # Component (auto-wrapped by plugin)
│   ├── Button.skin.ts       # Default skin (required)
│   ├── Button.dark.ts       # Variant: dark
│   ├── Button.light.ts      # Variant: light
│   └── base.ts              # Shared base styles (optional)
│
├── Card/
│   ├── Card.tsx
│   ├── skins/               # Alternative: skins folder
│   │   ├── default.ts
│   │   ├── elevated.ts
│   │   └── outlined.ts
│   └── base.ts
```

**Plugin scans both:**
1. `ComponentName.{variant}.ts` (sibling files)
2. `skins/{variant}.ts` (skins folder)

### TypeScript Experience

**Generated types:**
```typescript
// Auto-generated by plugin
import type { ShadowComponentProps } from '@my-lib/react'

// Plugin scans and generates this
export interface ButtonSkins {
  default: './Button.skin'
  dark: './Button.dark'
  light: './Button.light'
}

// Augments your component
export const Button: React.FC<
  ButtonProps & ShadowComponentProps<keyof ButtonSkins>
>
```

**In your code:**
```typescript
// Full autocomplete works!
<Button
  skin="dark"              // ✅ Autocomplete: 'default' | 'dark' | 'light'
  variant="primary"        // ✅ From ButtonProps
  invalidProp="test"       // ❌ TypeScript error
/>
```

### Performance Characteristics

**Build-time:**
- Plugin runs during Vite transform phase
- One-time cost per component
- Cached by Vite (fast rebuilds)

**Runtime:**
- Identical to explicit `createShadowComponent`
- Same lazy loading behavior
- Same memory characteristics
- Zero additional overhead

**Bundle size:**
- Same as explicit API (plugin just generates it)
- No extra plugin runtime
- Tree-shakeable

---

## Side-by-Side Comparison

### Simple Button Component

#### Styled-Components (Migration From)

```typescript
import styled from 'styled-components'

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? 'blue' : 'gray'};
  padding: 1rem 2rem;
  color: white;
`

// Usage
<Button variant="primary">Click Me</Button>
```

#### Option 1: createShadowComponent

```typescript
import { createShadowComponent, SkinProvider } from '@my-lib/react'

export const Button = createShadowComponent<ButtonProps>({
  name: 'button',
  skins: { material: () => import('./material') },
  render: ({ variant, children }) => (
    <button part="surface" variant={variant}>
      {children}
    </button>
  )
})

// Usage with Provider (REQUIRED)
<SkinProvider skin="material">
  <Button variant="primary">Click Me</Button>
</SkinProvider>

// Override via nested provider
<SkinProvider skin="material">
  <Button variant="primary">Normal</Button>

  <SkinProvider skin="brutalist">
    <Button variant="primary">Different</Button>
  </SkinProvider>
</SkinProvider>
```

#### Option 2: HOC

```typescript
import { withShadowStyles, SkinProvider } from '@my-lib/react'

const Button = ({ variant, children }) => (
  <button part="surface" variant={variant}>
    {children}
  </button>
)

export default withShadowStyles(Button, {
  name: 'button',
  skins: { material: () => import('./material') }
})

// Usage with Provider (REQUIRED)
<SkinProvider skin="material">
  <Button variant="primary">Click Me</Button>
</SkinProvider>
```

#### Option 3: Hook

```typescript
import { useShadowStyles, useSkinContext, SkinProvider } from '@my-lib/react'

export const Button = ({ variant, children }) => {
  const skin = useSkinContext() // No skin prop!

  const { ref } = useShadowStyles('button', { material: () => import('./material') }, skin)

  return (
    <shadow-root ref={ref}>
      <button part="surface" variant={variant}>
        {children}
      </button>
    </shadow-root>
  )
}

// Usage with Provider (REQUIRED)
<SkinProvider skin="material">
  <Button variant="primary">Click Me</Button>
</SkinProvider>
```

#### Option 4: Vite Plugin (Convention)

```typescript
// Button.tsx - Just write normal React! (No skin prop!)
export const Button = ({ variant, children }) => (
  <button part="surface" variant={variant}>
    {children}
  </button>
)

// Button.skin.ts - Separate file (auto-discovered)
import { COLORS } from '@/tokens'

export default `
  [part="surface"] {
    background: ${COLORS.primary};
    padding: 1rem 2rem;
  }
`

// Usage with Provider (REQUIRED)
import { SkinProvider } from '@my-lib/react'

<SkinProvider skin="default">
  <Button variant="primary">Click Me</Button>
</SkinProvider>

// Plugin auto-wires useSkinContext() internally
```

---

## TypeScript Experience

### createShadowComponent

```typescript
// Excellent inference
const Button = createShadowComponent<ButtonProps>({ /* ... */ })

// Props are fully typed
<Button
  skin="material"      // ✅ Autocomplete: 'material' | 'brutalist'
  variant="primary"    // ✅ Autocomplete from ButtonProps
  invalidProp="test"   // ❌ TypeScript error
/>

// Skin names are typed
type SkinName = ComponentProps<typeof Button>['skin']
// → 'material' | 'brutalist'
```

### HOC

```typescript
// May need explicit generic
const Button = withShadowStyles<ButtonProps>(ButtonBase, { /* ... */ })

// Or use type assertion
export const Button = withShadowStyles(ButtonBase, {
  // ...
}) as React.FC<ButtonProps & { skin?: 'material' | 'brutalist' }>

// Props flow correctly
<Button
  variant="primary"    // ✅ From ButtonProps
  skin="material"      // ✅ Added by HOC
/>
```

### Hook

```typescript
// Hook returns typed values
const { ref, skin, setSkin } = useShadowStyles<'material' | 'brutalist'>(
  'button',
  skins,
  'material'
)

// Manual typing for component
export const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  // ...
}
```

---

## Adoption Scenarios

### Scenario 1: Greenfield Project (Vite-based)

**Best choice: Vite Plugin**

- Zero boilerplate (89% less code)
- Components are just React
- Convention-based (familiar from Next.js, CSS Modules)
- Perfect for starting fresh

**Alternative: createShadowComponent**
- If you want explicit API
- If you may switch bundlers later

### Scenario 2: Greenfield Project (Non-Vite)

**Best choice: createShadowComponent**

- Works with any bundler
- Clean, explicit API
- Good TypeScript support

### Scenario 3: Migrating from styled-components

**Best choice: HOC or createShadowComponent**

- HOC preserves component structure
- createShadowComponent feels familiar (factory pattern)
- Can migrate gradually (one component at a time)

**If using Vite: Consider plugin**
- Can mix plugin + explicit API in same project
- Migrate components one by one

### Scenario 4: Large Existing Codebase

**Best choice: HOC**

- Minimal refactoring (wrap existing components)
- Can coexist with existing styling
- Progressive migration path

**If using Vite: Consider plugin for new components**
- Use HOC for migrated components
- Use plugin for new components
- Both can coexist

### Scenario 5: Performance-Critical

**Best choice: Macro (if willing to add build step) or Vite Plugin**

- Both have zero runtime overhead
- Plugin is easier to set up (if using Vite)
- Macro works with any bundler

---

## Hybrid API Recommendation

**Provide multiple entry points:**

```typescript
// @my-lib/react exports all patterns
import {
  createShadowComponent,    // Factory
  withShadowStyles,         // HOC
  useShadowStyles,          // Hook
  ShadowRoot,               // Component
} from '@my-lib/react'

// @my-lib/vite-plugin (separate package)
import { shadowComponents } from '@my-lib/vite-plugin'

// Let developers choose based on their needs
```

**Default recommendation hierarchy:**

1. **For Vite projects (greenfield):** Vite Plugin
   - Zero boilerplate (write normal React)
   - Convention-based (familiar pattern)
   - Best DX for new projects
   - Can opt-out to explicit API when needed

2. **For most projects (any bundler):** `createShadowComponent`
   - Best balance of simplicity and features
   - Clear mental model
   - Good TypeScript support
   - Works everywhere

3. **For existing codebases:** `withShadowStyles` (HOC)
   - Minimal refactoring
   - Wraps existing components
   - Progressive migration

4. **For maximum flexibility:** Hooks + `ShadowRoot`
   - Full control
   - Composes with anything
   - Modern React patterns

5. **For build-time optimization (non-Vite):** Macro (optional)
   - Requires additional setup
   - Maximum performance
   - For advanced users
   - Note: If using Vite, prefer plugin instead

---

## API Evolution Path

### Phase 1: Core (v1.0)

```typescript
// @my-lib/react - Start with minimal API
export { createShadowComponent } from './factory'
export { withShadowStyles } from './hoc'
```

**Rationale:**
- Two clear options
- Cover 90% of use cases
- Easy to understand
- Works with any bundler

### Phase 2: Vite Plugin (v1.1)

```typescript
// @my-lib/vite-plugin - Separate package for Vite users
export { shadowComponents } from './plugin'
```

**Rationale:**
- Huge DX win for Vite users (89% less code)
- Convention-based (familiar pattern)
- Separate package (doesn't bloat core)
- Optional (can use core API instead)

### Phase 3: Flexibility (v1.2)

```typescript
// @my-lib/react - Add hook-based API
export { useShadowStyles, ShadowRoot } from './hooks'
```

**Rationale:**
- For power users
- Composability
- Advanced patterns

### Phase 4: Optimization (v1.3+)

```typescript
// @my-lib/react.macro - Optional macro package
export { shadow } from '@my-lib/react.macro'
```

**Rationale:**
- For performance-critical apps (non-Vite)
- Separate package (opt-in)
- Advanced feature
- Note: Most Vite users can use plugin instead

---

## Documentation Strategy

### Landing Page Example (Key to Adoption)

```typescript
// Show the simplest possible example
import { createShadowComponent, SkinProvider } from '@my-lib/react'

const Button = createShadowComponent({
  name: 'button',
  skins: {
    material: () => import('./material'),
    dark: () => import('./dark')
  },
  render: ({ children }) => <button>{children}</button>
})

// Wrap your app with the skin you want
function App() {
  return (
    <SkinProvider skin="material">
      <Button>Click Me</Button>
      <Button>Another Button</Button>
    </SkinProvider>
  )
}

// That's it! You now have styled buttons with:
// ✅ True CSS encapsulation (Shadow DOM)
// ✅ Zero runtime cost
// ✅ Lazy-loaded styles
// ✅ Multiple skins support
// ✅ Context-based (no prop drilling)
```

**Key: Show Provider pattern immediately - this is the recommended way**

---

## Resistance Mitigation Strategies

### 1. **Provide Escape Hatches**

```typescript
// Advanced: Access underlying custom element
const Button = createShadowComponent({ /* ... */ })

// Get element reference
const elementRef = useRef<HTMLElement>(null)
<Button ref={elementRef} />

// Access shadow root if needed
elementRef.current?.shadowRoot
```

### 2. **Progressive Disclosure**

```typescript
// Simple start (hide complexity)
createShadowComponent({
  name: 'button',
  skins: { default: () => import('./style') },
  render: () => <button>Click</button>
})

// Gradually reveal features
createShadowComponent({
  name: 'button',
  base: () => import('./base'),      // ← Add base
  skins: { /* ... */ },
  defaultSkin: 'material',           // ← Add default
  parts: ['surface', 'label'],       // ← Export parts
  render: () => <button>Click</button>
})
```

### 3. **Excellent Error Messages**

```typescript
// Bad
// Error: Invalid skin

// Good
// Error: Skin "dark" not found for component "button"
//
// Available skins: "material", "brutalist"
//
// Did you mean "dark" → "material"?
//
// To add the "dark" skin:
//   skins: {
//     material: () => import('./material'),
//     dark: () => import('./dark'),  // ← Add this
//   }
```

### 4. **Codemods**

```bash
# Migrate from styled-components
npx @my-lib/codemod styled-components-to-shadow ./src

# Before
const Button = styled.button`...`

# After
const Button = createShadowComponent({
  name: 'button',
  skins: { default: () => import('./button-styles') },
  render: (props) => <button {...props} />
})
```

---

## Recommendation Matrix

| Factor | Vite Plugin | createShadowComponent | HOC | Hook | Macro |
|--------|------------|----------------------|-----|------|-------|
| **Adoption** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Resistance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **TypeScript** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Flexibility** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Debugging** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Portability** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Legend:**
- ⭐⭐⭐⭐⭐ Excellent
- ⭐⭐⭐⭐ Very Good
- ⭐⭐⭐ Good
- ⭐⭐ Fair

**Notes:**
- **Vite Plugin**: Best for greenfield Vite projects, but Vite-only (low portability)
- **createShadowComponent**: Best all-around choice, works everywhere
- **HOC**: Lowest resistance for teams familiar with React patterns
- **Hook**: Most flexible but requires more code
- **Macro**: Highest performance but declining ecosystem support

---

## Final Recommendation

### Path A: Vite Projects (Recommended for Greenfield)

**Primary: Vite Plugin**

**Why:**
- Zero boilerplate (89% less code)
- Components are just React (no new patterns)
- Convention-based (familiar from Next.js, CSS Modules)
- Excellent DX (write normal components)
- Can opt-out to explicit API when needed

**Fallback: `createShadowComponent`**
- When you need explicit control
- When you want to see the wiring
- When debugging plugin transformations

---

### Path B: Non-Vite or Existing Codebases

**Primary: `createShadowComponent`**

**Why:**
- Best balance of simplicity and features
- Clear mental model (factory pattern)
- Excellent TypeScript support
- Low resistance (familiar pattern)
- Progressive enhancement path
- Works with any bundler

**Secondary: `withShadowStyles` (HOC)**

**Why:**
- For migrating existing codebases
- Minimal refactoring needed
- Very low resistance (HOCs are known)
- Can wrap existing components

**Power User: Hooks + `ShadowRoot`**

**Why:**
- Maximum flexibility
- Modern React patterns
- For advanced use cases
- Composes with everything

**Optional: Macro**

**Why:**
- For performance enthusiasts
- Separate package (opt-in)
- Not required for 99% of users
- Note: If using Vite, prefer plugin instead

---

## Summary

**For new Vite projects:** Start with Vite Plugin (convention-based)
- Zero boilerplate
- Best DX
- Can drop down to explicit API when needed

**For existing projects or non-Vite:** Start with `createShadowComponent`
- Clear, explicit API
- Works everywhere
- Good balance

**For migration scenarios:** Use `withShadowStyles` (HOC)
- Minimal refactoring
- Progressive adoption

**Ship all three** in separate packages:
- `@my-lib/react` - Core APIs (factory, HOC, hooks)
- `@my-lib/vite-plugin` - Convention-based plugin (optional)
- `@my-lib/react.macro` - Macro for non-Vite optimization (optional)

---

**Status:** API proposals complete with 5 flavors + adoption analysis.
**Next:** Pick API direction(s) and prototype.
