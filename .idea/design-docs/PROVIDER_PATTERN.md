# Skin Provider Pattern

**Version:** 1.0
**Date:** 2025-12-27
**Critical:** This is how skins are actually applied in practice

---

## The Problem: Prop Drilling is Terrible

**❌ WRONG - Don't do this:**

```tsx
// Having to specify skin on every component is horrible DX
<div>
  <Button skin="material" variant="primary">
    Save
  </Button>
  <Card skin="material">
    <Input skin="material" />
    <Checkbox skin="material" />
    <Button skin="material" variant="secondary">
      Cancel
    </Button>
  </Card>
  <Dropdown skin="material">
    <MenuItem skin="material">Option 1</MenuItem>
    <MenuItem skin="material">Option 2</MenuItem>
  </Dropdown>
</div>

// This is repetitive, error-prone, and doesn't scale
```

---

## The Solution: React Context Provider

**✅ CORRECT - Do this:**

```tsx
// Set skin once at app level (or section level)
<SkinProvider skin="material">
  <div>
    <Button variant="primary">Save</Button>
    <Card>
      <Input />
      <Checkbox />
      <Button variant="secondary">Cancel</Button>
    </Card>
    <Dropdown>
      <MenuItem>Option 1</MenuItem>
      <MenuItem>Option 2</MenuItem>
    </Dropdown>
  </div>
</SkinProvider>

// Clean, concise, maintainable
```

---

## How It Works

### 1. Provider Sets Context

```tsx
import { SkinProvider } from '@my-lib/react'

// Wrap your app (or any subtree)
function App() {
  return (
    <SkinProvider skin="material">
      <YourApp />
    </SkinProvider>
  )
}
```

### 2. Components Read from Context

```tsx
// Inside Button component (implementation detail)
function ButtonElement() {
  const skin = useSkinContext() // Reads "material" from context

  useEffect(() => {
    // Load the skin stylesheet
    const sheet = await cache.acquire(skin)
    shadowRoot.adoptedStyleSheets = [sheet]
  }, [skin])
}

// Consumers don't see this - it just works!
;<Button>Click Me</Button>
```

### 3. Optional Override Per Component

```tsx
// Most components use context skin
<SkinProvider skin="material">
  <Button>Normal</Button>
  <Button>Also normal</Button>

  {/* But you can override specific instances */}
  <Button skin="brutalist">Special!</Button>
</SkinProvider>
```

---

## Provider Nesting

**Providers can nest for different sections:**

```tsx
<SkinProvider skin="material">
  <Header>
    <Button>Home</Button>
    <Button>About</Button>
  </Header>

  <main>
    <Card>Normal content</Card>

    {/* High contrast section for accessibility */}
    <SkinProvider skin="high-contrast">
      <AccessibilitySettings>
        <Button>Increase Font</Button>
        <Button>Toggle Contrast</Button>
      </AccessibilitySettings>
    </SkinProvider>

    {/* Back to material */}
    <Card>More content</Card>
  </main>

  {/* Dark mode footer */}
  <SkinProvider skin="dark">
    <Footer>
      <Button>Contact</Button>
    </Footer>
  </SkinProvider>
</SkinProvider>
```

**Nesting behavior:**

```tsx
<SkinProvider skin="material">
  <Button>Uses: material</Button>

  <SkinProvider skin="dark">
    <Button>Uses: dark</Button>

    <SkinProvider skin="xmas">
      <Button>Uses: xmas</Button>
    </SkinProvider>

    <Button>Uses: dark (back to parent)</Button>
  </SkinProvider>

  <Button>Uses: material (back to root)</Button>
</SkinProvider>
```

---

## State Management Integration

### With useState (Simple)

```tsx
function App() {
  const [skin, setSkin] = useState('material')

  return (
    <SkinProvider skin={skin}>
      <header>
        <select value={skin} onChange={(e) => setSkin(e.target.value)}>
          <option value="material">Material</option>
          <option value="brutalist">Brutalist</option>
          <option value="dark">Dark</option>
        </select>
      </header>

      <main>
        <YourApp />
      </main>
    </SkinProvider>
  )
}
```

### With Redux

```tsx
import { useSelector } from 'react-redux'

function App() {
  const skin = useSelector((state) => state.theme.currentSkin)

  return (
    <SkinProvider skin={skin}>
      <YourApp />
    </SkinProvider>
  )
}

// Dispatch actions to change skin
dispatch({ type: 'theme/setSkin', payload: 'dark' })
```

### With Zustand

```tsx
import { useThemeStore } from './store'

function App() {
  const skin = useThemeStore((state) => state.skin)

  return (
    <SkinProvider skin={skin}>
      <YourApp />
    </SkinProvider>
  )
}

// Change skin
useThemeStore.setState({ skin: 'brutalist' })
```

### With URL/Query Params

```tsx
import { useSearchParams } from 'react-router-dom'

function App() {
  const [searchParams] = useSearchParams()
  const skin = searchParams.get('skin') || 'material'

  return (
    <SkinProvider skin={skin}>
      <YourApp />
    </SkinProvider>
  )
}

// URL: /?skin=dark
```

### With User Preferences API

```tsx
function App() {
  const [skin, setSkin] = useState(() => {
    return localStorage.getItem('preferred-skin') || 'material'
  })

  useEffect(() => {
    localStorage.setItem('preferred-skin', skin)
  }, [skin])

  return (
    <SkinProvider skin={skin}>
      <ThemeSelector onSkinChange={setSkin} />
      <YourApp />
    </SkinProvider>
  )
}
```

---

## Development & Debugging Use Cases

### 1. Testing Different Skins Side-by-Side

```tsx
// Compare skins during development
<div style={{ display: 'flex', gap: '2rem' }}>
  <SkinProvider skin="material">
    <Card>
      <h3>Material</h3>
      <Button>Click Me</Button>
    </Card>
  </SkinProvider>

  <SkinProvider skin="brutalist">
    <Card>
      <h3>Brutalist</h3>
      <Button>Click Me</Button>
    </Card>
  </SkinProvider>

  <SkinProvider skin="glass">
    <Card>
      <h3>Glass</h3>
      <Button>Click Me</Button>
    </Card>
  </SkinProvider>
</div>
```

### 2. Isolated Component Testing

```tsx
// Test a component with different skins
describe('Button', () => {
  it('renders with material skin', () => {
    render(
      <SkinProvider skin="material">
        <Button>Click Me</Button>
      </SkinProvider>
    )
    // assertions...
  })

  it('renders with high-contrast skin', () => {
    render(
      <SkinProvider skin="high-contrast">
        <Button>Click Me</Button>
      </SkinProvider>
    )
    // assertions...
  })
})
```

### 3. Debug Mode Override

```tsx
function App() {
  const [debugMode, setDebugMode] = useState(false)
  const [skin, setSkin] = useState('material')

  return (
    <SkinProvider skin={debugMode ? 'debug-wireframe' : skin}>
      <DevTools>
        <label>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          Debug Mode (Wireframe)
        </label>
      </DevTools>

      <YourApp />
    </SkinProvider>
  )
}
```

### 4. Component Library Showcase

```tsx
// Storybook-style showcase
function ComponentShowcase() {
  const [skin, setSkin] = useState('material')

  return (
    <>
      <SkinSelector value={skin} onChange={setSkin} />

      <SkinProvider skin={skin}>
        <section>
          <h2>Buttons</h2>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
        </section>

        <section>
          <h2>Cards</h2>
          <Card>Example card</Card>
        </section>

        <section>
          <h2>Forms</h2>
          <Input placeholder="Enter text" />
          <Checkbox>Accept terms</Checkbox>
        </section>
      </SkinProvider>
    </>
  )
}
```

---

## API Design

### Basic Provider API

```tsx
interface SkinProviderProps {
  skin: string
  children: React.ReactNode

  // Optional: preload skin immediately
  preload?: boolean

  // Optional: fallback while loading
  fallback?: React.ReactNode
}

function SkinProvider({
  skin,
  children,
  preload,
  fallback,
}: SkinProviderProps) {
  // Implementation uses React Context
  return <SkinContext.Provider value={skin}>{children}</SkinContext.Provider>
}
```

### Hook to Read Context

```tsx
function useSkinContext(): string {
  const skin = useContext(SkinContext)

  if (!skin) {
    throw new Error('useSkinContext must be used within <SkinProvider>')
  }

  return skin
}

// Usage in custom components
function MyComponent() {
  const skin = useSkinContext()
  console.log('Current skin:', skin)
}
```

### Hook to Change Skin

```tsx
// Advanced: Provider that allows changing skin
function SkinProvider({ children }) {
  const [skin, setSkin] = useState('material')

  return (
    <SkinContext.Provider value={{ skin, setSkin }}>
      {children}
    </SkinContext.Provider>
  )
}

// Consumer hook
function useSkin() {
  const context = useContext(SkinContext)
  return context
}

// Usage
function ThemeToggle() {
  const { skin, setSkin } = useSkin()

  return (
    <button onClick={() => setSkin(skin === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  )
}
```

---

## TypeScript Support

```tsx
// Type-safe skin names
type SkinName = 'material' | 'brutalist' | 'dark' | 'high-contrast'

interface SkinProviderProps {
  skin: SkinName
  children: React.ReactNode
}

export function SkinProvider({ skin, children }: SkinProviderProps) {
  // ...
}

// Usage with autocomplete
<SkinProvider skin="material">  {/* ✅ Autocomplete works */}
<SkinProvider skin="invalid">   {/* ❌ TypeScript error */}
```

---

## Performance Considerations

### 1. Provider Doesn't Re-render Children

```tsx
// Changing skin ONLY updates shadow stylesheets
// React components don't re-render!

<SkinProvider skin={skin}>
  <ExpensiveComponent /> {/* Doesn't re-render when skin changes */}
</SkinProvider>

// This is because skin changes are applied at the shadow DOM level
// not through React props
```

### 2. Lazy Loading Still Works

```tsx
// Skins are still lazy-loaded on demand
<SkinProvider skin="material">
  {/* material.css only loads when first Button mounts */}
  <Button>Click Me</Button>
</SkinProvider>
```

### 3. Sheet Sharing Across Provider Boundaries

```tsx
// Even with multiple providers, sheets are shared!
<SkinProvider skin="material">
  <Button />  {/* Loads material.css */}
  <Button />  {/* Reuses same sheet */}
</SkinProvider>

<SkinProvider skin="material">
  <Button />  {/* Reuses same sheet from cache! */}
</SkinProvider>

// Memory: 1 CSSStyleSheet for material (shared everywhere)
```

---

## Real-World Example

```tsx
// App.tsx
import { SkinProvider } from '@my-lib/react'
import { useUser } from './hooks/useUser'

function App() {
  const user = useUser()
  const skin = user.preferences.theme || 'material'

  return (
    <SkinProvider skin={skin}>
      <Router>
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin section uses different skin */}
          <Route
            path="/admin"
            element={
              <SkinProvider skin="admin-dark">
                <AdminPanel />
              </SkinProvider>
            }
          />
        </Routes>

        <Footer />
      </Router>
    </SkinProvider>
  )
}

// Settings.tsx
function Settings() {
  const { updatePreferences } = useUser()
  const [selectedSkin, setSelectedSkin] = useState('material')

  const handleSave = () => {
    updatePreferences({ theme: selectedSkin })
    // Provider will pick up new skin from user state
  }

  return (
    <Card>
      <h2>Theme Settings</h2>

      {/* Preview with temporary provider */}
      <SkinProvider skin={selectedSkin}>
        <div className="preview">
          <Button>Preview Button</Button>
          <Card>Preview Card</Card>
        </div>
      </SkinProvider>

      <select
        value={selectedSkin}
        onChange={(e) => setSelectedSkin(e.target.value)}
      >
        <option value="material">Material</option>
        <option value="brutalist">Brutalist</option>
        <option value="dark">Dark</option>
      </select>

      <Button onClick={handleSave}>Save</Button>
    </Card>
  )
}
```

---

## IMPORTANT: No `skin` Prop on Components!

### ❌ WRONG - Don't expose `skin` as a prop

```tsx
// This pollutes the component API!
;<SkinProvider skin="material">
  <Button skin="brutalist">Click Me</Button> {/* ❌ NO! */}
</SkinProvider>

// Component interface should NOT include skin
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  skin?: string // ❌ Don't do this!
}
```

### ✅ CORRECT - Override via nested providers

```tsx
// Override using nested providers only
;<SkinProvider skin="material">
  <Button>Normal button</Button>

  {/* Use nested provider for different skin */}
  <SkinProvider skin="brutalist">
    <Button>Different skin button</Button>
  </SkinProvider>

  <Button>Back to normal</Button>
</SkinProvider>

// Component interface is clean
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  // No skin prop!
}
```

### Implementation Detail

**Internally, components:**

1. Read skin from context: `const skin = useSkinContext()`
2. Use skin value to load stylesheet: `const sheet = await cache.acquire(skin)`
3. May set as attribute on custom element: `<button-element skin={skin}>`

**But externally, consumers:**

- Never see or use `skin` as a prop
- Only interact with `<SkinProvider>` for skin selection
- Components automatically inherit skin from context

---

## Key Takeaways

1. **Provider is the ONLY way consumers set skins**
   - Wrap app or sections with `<SkinProvider>`
   - Components automatically inherit skin from context
   - No `skin` prop on components!

2. **Override via nested providers, not props**
   - Use nested `<SkinProvider>` for different sections
   - Components never accept `skin` as a prop
   - Inner providers override outer ones

3. **Clean component APIs**
   - Components only expose domain props (variant, disabled, etc.)
   - Skin selection is external concern via Provider
   - Keeps component interface focused

4. **Easy state management integration**
   - Works with any state solution (Redux, Zustand, useState, etc.)
   - Provider accepts dynamic skin prop
   - Components never care about state management

5. **Great for development & debugging**
   - Compare skins side-by-side via multiple providers
   - Test components in isolation
   - Debug mode skins via provider

6. **Performance is maintained**
   - Sheets are shared across providers
   - Components don't re-render on skin change
   - Lazy loading still works

---

**Status:** Provider pattern documented.
**Next:** Update all API proposals to show proper Provider usage.
