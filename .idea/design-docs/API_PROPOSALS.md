# API Proposals: Ergonomics & Adoption Analysis

**Version:** 0.1
**Date:** 2025-12-27
**Focus:** Developer experience, adoption, and resistance minimization

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

// Usage
<Button skin="material" variant="primary">Click Me</Button>
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

// Usage
<Button skin="material" variant="primary">Click Me</Button>
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
import { useShadowStyles } from '@my-lib/react'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

const skins = {
  material: () => import('./skins/material'),
  brutalist: () => import('./skins/brutalist'),
}

export const Button = ({ variant = 'primary', children, ...props }: ButtonProps) => {
  const { ref, skin, setSkin } = useShadowStyles('button', skins, 'material')

  return (
    <shadow-root ref={ref} exportparts="surface,label">
      <button part="surface" variant={variant} {...props}>
        <span part="label">{children}</span>
      </button>
    </shadow-root>
  )
}

// Usage
<Button variant="primary">Click Me</Button>
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
import { createShadowComponent } from '@my-lib/react'

export const Button = createShadowComponent<ButtonProps>({
  name: 'button',
  skins: { material: () => import('./material') },
  render: ({ variant, children }) => (
    <button part="surface" variant={variant}>
      {children}
    </button>
  )
})

// Usage
<Button skin="material" variant="primary">Click Me</Button>
```

#### Option 2: HOC

```typescript
import { withShadowStyles } from '@my-lib/react'

const Button = ({ variant, children }) => (
  <button part="surface" variant={variant}>
    {children}
  </button>
)

export default withShadowStyles(Button, {
  name: 'button',
  skins: { material: () => import('./material') }
})

// Usage
<Button skin="material" variant="primary">Click Me</Button>
```

#### Option 3: Hook

```typescript
import { ShadowRoot, useSkin } from '@my-lib/react'

export const Button = ({ variant, children }) => {
  const skin = useSkin('material')

  return (
    <ShadowRoot name="button" skins={{ material: () => import('./material') }}>
      <button part="surface" variant={variant}>
        {children}
      </button>
    </ShadowRoot>
  )
}

// Usage
<Button variant="primary">Click Me</Button>
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

### Scenario 1: Greenfield Project

**Best choice: createShadowComponent or Hook**

- No migration concerns
- Can choose based on team preference
- Hook for flexibility, factory for simplicity

### Scenario 2: Migrating from styled-components

**Best choice: HOC or createShadowComponent**

- HOC preserves component structure
- createShadowComponent feels familiar (factory pattern)
- Can migrate gradually (one component at a time)

### Scenario 3: Large Existing Codebase

**Best choice: HOC**

- Minimal refactoring (wrap existing components)
- Can coexist with existing styling
- Progressive migration path

### Scenario 4: Performance-Critical

**Best choice: Macro (if willing to add build step)**

- Zero runtime overhead
- Fully compiled
- But: adds complexity

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

// Let developers choose based on their needs
```

**Default recommendation hierarchy:**

1. **For most projects:** `createShadowComponent`
   - Best balance of simplicity and features
   - Clear mental model
   - Good TypeScript support

2. **For existing codebases:** `withShadowStyles` (HOC)
   - Minimal refactoring
   - Wraps existing components
   - Progressive migration

3. **For maximum flexibility:** Hooks + `ShadowRoot`
   - Full control
   - Composes with anything
   - Modern React patterns

4. **For build-time optimization:** Macro (optional)
   - Requires additional setup
   - Maximum performance
   - For advanced users

---

## API Evolution Path

### Phase 1: Core (v1.0)

```typescript
// Start with minimal API
export { createShadowComponent } from './factory'
export { withShadowStyles } from './hoc'
```

**Rationale:**
- Two clear options
- Cover 90% of use cases
- Easy to understand

### Phase 2: Flexibility (v1.1)

```typescript
// Add hook-based API
export { useShadowStyles, ShadowRoot } from './hooks'
```

**Rationale:**
- For power users
- Composability
- Advanced patterns

### Phase 3: Optimization (v1.2+)

```typescript
// Optional macro package
export { shadow } from '@my-lib/react.macro'
```

**Rationale:**
- For performance-critical apps
- Separate package (opt-in)
- Advanced feature

---

## Documentation Strategy

### Landing Page Example (Key to Adoption)

```typescript
// Show the simplest possible example
import { createShadowComponent } from '@my-lib/react'

const Button = createShadowComponent({
  name: 'button',
  skins: {
    default: () => import('./button.css')
  },
  render: ({ children }) => <button>{children}</button>
})

// That's it! You now have a styled button with:
// ✅ True CSS encapsulation (Shadow DOM)
// ✅ Zero runtime cost
// ✅ Lazy-loaded styles
// ✅ Multiple skins support
```

**Key: Show value in 10 lines of code**

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

| Factor | createShadowComponent | HOC | Hook | Macro |
|--------|----------------------|-----|------|-------|
| **Adoption** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Resistance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Flexibility** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Debugging** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

**Legend:**
- ⭐⭐⭐⭐⭐ Excellent
- ⭐⭐⭐⭐ Very Good
- ⭐⭐⭐ Good
- ⭐⭐ Fair

---

## Final Recommendation

### Primary API: `createShadowComponent`

**Why:**
- Best balance of simplicity and features
- Clear mental model (factory pattern)
- Excellent TypeScript support
- Low resistance (familiar pattern)
- Progressive enhancement path

### Secondary API: `withShadowStyles` (HOC)

**Why:**
- For migrating existing codebases
- Minimal refactoring needed
- Very low resistance (HOCs are known)
- Can wrap existing components

### Power User API: Hooks + `ShadowRoot`

**Why:**
- Maximum flexibility
- Modern React patterns
- For advanced use cases
- Composes with everything

### Optional: Macro

**Why:**
- For performance enthusiasts
- Separate package (opt-in)
- Not required for 99% of users

---

**Status:** API proposals defined with adoption analysis.
**Next:** Pick API direction(s) and prototype.
