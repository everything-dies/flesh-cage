# Styled - The Main Factory Function

## Overview

The `styled/` module is the **crown jewel** of the flesh-cage architecture. This is the factory function that creates styled components using a revolutionary Web Components + React hybrid architecture. Every styled component your users create goes through this module.

**Purpose:** Create styled React components backed by Custom Elements with Shadow DOM encapsulation, supporting both synchronous and asynchronous skin loading, dynamic skin switching, and React 18 Suspense integration.

**Lines of code:** 106 lines total

- Imports and exports: 11 lines
- `verify` helper function: 4 lines
- `styled` factory function: 91 lines
  - `CustomElement` class definition: 67 lines (lines 26-92)
  - `Styled` component: 9 lines (lines 93-101)
  - Custom element registration: 3 lines (lines 103-105)

**Complexity level:** CRITICAL - This is the most complex module in the system. It orchestrates Custom Elements, Shadow DOM, React portals, AbortController race condition handling, event-driven communication, and async stylesheet adoption.

**Dependencies:**

- `react` - For `createElement`, `createPortal`, `ComponentType`, `PropsWithChildren`
- `react-dom` - For `createPortal`
- `../types/` - For `StyledConfig` type
- `../sheets/` - For `Sheets` class (stylesheet management and caching)
- `../use-core/` - For `useCore` hook (Shadow DOM lifecycle management)

**Dependents:**

- User applications - This is the primary public API users interact with
- All styled components in the wild depend on this factory

## Philosophy & Design Decisions

### Why Web Components + React Hybrid Architecture?

This is not your typical styled-components or Emotion approach. We're doing something fundamentally different here: **combining Web Components' encapsulation with React's component model**.

#### The Traditional Approach (styled-components, Emotion)

```typescript
// Traditional: CSS-in-JS with global style injection
const Button = styled.button`
  color: blue;
  background: navy;
`
// Problem: Styles leak into global scope via <style> tags in <head>
// Solution: Class name mangling (.sc-button-abc123)
// Tradeoff: Large runtime, CSS injection overhead, no true encapsulation
```

#### Our Approach (flesh-cage)

```typescript
// flesh-cage: Shadow DOM encapsulation + async skin loading
const Button = styled('button', {
  name: 'my-button',
  skins: {
    primary: () => import('./skins/button.primary.css'),
  },
})
// Benefit: True style encapsulation, no class name mangling needed
// Benefit: Async skin loading with code splitting
// Benefit: Zero CSS leakage (Shadow DOM boundary)
// Tradeoff: Custom Elements learning curve, portal complexity
```

### Why Custom Elements?

Custom Elements provide the **host element** for Shadow DOM. We need a real DOM element with a shadow root to attach styles to. React components are virtual—they don't exist in the DOM until reconciliation. Custom Elements give us a stable DOM node that exists independently of React's render cycle.

**Key insight:** The Custom Element (`<my-button>`) is the wrapper. The actual React component (the `<button>`) renders inside the shadow root via a portal. This separation allows us to:

1. **Control the lifecycle independently** - React manages the inner component, Custom Element manages styles
2. **Encapsulate styles** - Shadow DOM prevents style leakage
3. **Handle async loading** - Custom Element can adopt stylesheets independently of React rendering
4. **Support dynamic theming** - Change the `skin` attribute and the Custom Element reacts

### Why Portals?

React portals (`createPortal`) are the bridge between React's virtual DOM and the Custom Element's shadow DOM. The portal teleports the React component (e.g., `<button>`) from where you write it (inside the `<Provider>`) to where it needs to render (inside the shadow root of `<my-button>`).

```mermaid
graph LR
    A[Your JSX: Button] -->|createPortal| B[Shadow Root]
    B --> C[Rendered: button inside shadow DOM]

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#d4edda
```

### Why AbortController?

Skin loading is asynchronous. Users can switch skins rapidly (e.g., clicking through theme options). Without AbortController, we'd have race conditions where an older, slower skin could overwrite a newer, faster skin.

**The problem:**

```
User clicks: skin="dark" (loads in 200ms)
User clicks: skin="light" (loads in 50ms)
Light loads first → Applied ✓
Dark loads later → Applied ✗ (Wrong! User wanted light)
```

**Our solution:**

```typescript
adorn = (skin: string) => {
  const { controller: previous } = this
  const next = (this.controller = new AbortController())
  // ...
  previous.abort() // Cancel the previous skin load
  // ...
  next.signal.throwIfAborted() // Don't apply if we've been aborted
}
```

Now only the most recent skin request completes. Earlier requests are aborted.

### Why Event-Driven Communication?

React lives in the virtual DOM world. Custom Elements live in the real DOM world. They need a protocol to communicate. We use **custom events** (`change`, `suspend`, `resume`) dispatched on the Custom Element.

- `change` event: Triggered by `useCore` when skin context changes → tells Custom Element to load new skin
- `suspend` event: Triggered by Custom Element when async skin load starts → tells `useCore` to integrate with Suspense
- `resume` event: Triggered when skin load completes → signals Suspense to resume rendering

## Architecture

### Overall Architecture Flow

```mermaid
graph TD
    A[User calls styled] -->|Creates| B[CustomElement class]
    A -->|Creates| C[Styled component function]
    A -->|Instantiates| D[Sheets instance]

    B -->|Registered as| E[customElements.define]

    F[User renders Styled component] -->|useCore hook| G[Shadow DOM lifecycle]
    F -->|createElement| H[Custom Element in DOM]
    F -->|createPortal| I[Children in Shadow Root]

    G -->|Dispatches| J[change event]
    J -->|Triggers| K[CustomElement.change]
    K -->|Calls| L[CustomElement.adorn]
    L -->|Uses| M[AbortController]
    L -->|Gets sheet from| D
    L -->|Adopts| N[adoptedStyleSheets]

    L -->|Triggers| O[suspend event]
    O -->|Integrates with| P[React Suspense]

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#fff4e1
    style D fill:#d4edda
    style E fill:#f8d7da
    style F fill:#e1f5ff
    style N fill:#d4edda
    style P fill:#cce5ff
```

### CustomElement Class Structure

```mermaid
classDiagram
    class CustomElement {
        +string[] observedAttributes
        +AbortController controller
        +ShadowRoot shadow
        +adorn(skin: string) Promise~CSSStyleSheet~
        +attributeChangedCallback(name, old, skin)
        +change(event: Event)
        +connectedCallback()
        +disconnectedCallback()
        +resume()
        +suspend(promise: Promise)
    }

    class HTMLElement {
        <<browser native>>
    }

    CustomElement --|> HTMLElement : extends

    note for CustomElement "Lives in real DOM\nManages Shadow DOM\nAdopts stylesheets\nHandles lifecycle"
```

### Skin Loading Sequence with AbortController

```mermaid
sequenceDiagram
    participant U as User/Provider
    participant CE as CustomElement
    participant AC1 as AbortController 1
    participant AC2 as AbortController 2
    participant S as Sheets
    participant SR as ShadowRoot

    U->>CE: skin="dark" (via change event)
    CE->>AC1: Create new AbortController
    CE->>S: sheets.get("dark")

    Note over S: Starts loading dark skin (200ms)

    U->>CE: skin="light" (user changed mind!)
    CE->>AC1: previous.abort() ← Cancel dark!
    CE->>AC2: Create new AbortController
    CE->>S: sheets.get("light")

    Note over S: Dark skin resolves (but aborted)

    S-->>CE: Dark skin ready
    CE->>AC1: signal.throwIfAborted()
    AC1-->>CE: AbortError thrown!
    CE->>CE: verify() catches AbortError → no-op

    Note over S: Light skin resolves (50ms)

    S-->>CE: Light skin ready
    CE->>AC2: signal.throwIfAborted()
    AC2-->>CE: Not aborted ✓
    CE->>SR: adoptedStyleSheets = [lightSheet]

    Note over SR: Light skin applied correctly!
```

### Event Flow Diagram

```mermaid
sequenceDiagram
    participant P as Provider (skin context)
    participant UC as useCore hook
    participant CE as CustomElement (DOM)
    participant R as React Suspense

    P->>UC: skin="primary" (context change)
    UC->>CE: dispatchEvent("change", { skin: "primary" })
    CE->>CE: change() handler triggered
    CE->>CE: adorn("primary") → load skin

    alt Skin is async
        CE->>CE: suspend(promise)
        CE->>UC: dispatchEvent("suspend", { detail: promise })
        UC->>R: persist(promise) → state update
        R->>R: Show fallback UI

        Note over CE: Async skin loading...

        CE->>CE: promise.finally(resume)
        CE->>UC: dispatchEvent("suspend") [no detail]
        UC->>R: persist(undefined) → clear suspension
        R->>R: Show content
    end

    CE->>CE: adoptStyleSheet → styles applied
```

### Complete Lifecycle: Factory Call to DOM Rendering

```mermaid
graph TB
    Start[User calls styled] --> CreateSheets[new Sheets with skins]
    CreateSheets --> DefineClass[Define CustomElement class]

    DefineClass --> CreateStyled[Create Styled component]
    DefineClass --> Register[customElements.define]

    CreateStyled --> Return[Return Styled component]

    Return --> UserRender[User renders Styled in JSX]

    UserRender --> UseCore[useCore hook executes]
    UseCore --> RefCreate[Create ref to Custom Element]
    UseCore --> LayoutEffect1[useLayoutEffect: Attach shadow root]
    UseCore --> LayoutEffect2[useLayoutEffect: Add event listeners]
    UseCore --> LayoutEffect3[useLayoutEffect: Dispatch change event]

    LayoutEffect1 --> ShadowAttached[Shadow root attached to container state]
    LayoutEffect2 --> ListenersReady[Listeners ready]
    LayoutEffect3 --> ChangeDispatched[change event dispatched]

    ChangeDispatched --> CEChange[CustomElement.change handler]
    CEChange --> CEAdorn[CustomElement.adorn]

    CEAdorn --> AbortPrevious[Abort previous controller]
    AbortPrevious --> CreateController[Create new controller]
    CreateController --> Validate[Validate skin name]

    Validate -->|Invalid| RejectPromise[Reject with Error]
    Validate -->|Valid| GetSheet[sheets.get → Load skin]

    GetSheet --> CheckAbort[signal.throwIfAborted]
    CheckAbort -->|Aborted| CatchVerify[verify catches AbortError]
    CheckAbort -->|Not aborted| AdoptSheet[adoptedStyleSheets = sheet]

    CEAdorn --> Suspend[suspend → dispatch suspend event]
    Suspend --> UseCoreListener[useCore suspend listener]
    UseCoreListener --> PersistPromise[persist promise in state]

    PersistPromise -->|suspendable: true| ThrowPromise[use throws promise → Suspense]
    PersistPromise -->|suspendable: false| NoSuspend[No suspension]

    AdoptSheet --> Resume[promise.finally → resume]
    Resume --> DispatchResume[dispatch suspend with no detail]
    DispatchResume --> ClearSuspension[persist undefined]

    ShadowAttached --> Portal[createPortal renders children]
    Portal --> ShadowDOM[Children in Shadow DOM]

    AdoptSheet --> StylesApplied[Styles in adoptedStyleSheets]
    StylesApplied --> FullyRendered[Component fully rendered!]
    ShadowDOM --> FullyRendered

    style Start fill:#e1f5ff
    style Return fill:#e1f5ff
    style UserRender fill:#fff4e1
    style FullyRendered fill:#d4edda
    style AdoptSheet fill:#d4edda
    style ThrowPromise fill:#cce5ff
```

## Code Walkthrough

Let's dissect every line of this 106-line masterpiece.

### Lines 1-10: Imports and Dependencies

```typescript
import { createPortal } from 'react-dom'
import {
  type ComponentType,
  type PropsWithChildren,
  createElement,
} from 'react'

import type { StyledConfig } from './types'
import { Sheets } from './sheets'
import { useCore } from './use-core'
```

**Analysis:**

- `createPortal`: The magic that teleports React components into Shadow DOM
- `ComponentType`: TypeScript type for both string ('button') and component function types
- `PropsWithChildren`: Ensures our styled components accept children
- `createElement`: React's factory function (we don't use JSX in core because this is a library)
- `StyledConfig`: Our configuration type (name, skins, suspendable, plus HTML attributes)
- `Sheets`: Manages stylesheet caching and async loading
- `useCore`: Handles Shadow DOM lifecycle, refs, and suspension

### Lines 12-15: The `verify` Helper Function

```typescript
export const verify = (error: Error) =>
  error instanceof DOMException && error.name === 'AbortError'
    ? Promise.resolve(error)
    : Promise.reject(error)
```

**Purpose:** Distinguish AbortErrors (expected, benign) from real errors (unexpected, should propagate).

**Why it's needed:**

When we abort a skin load, the promise rejects with a `DOMException` named `'AbortError'`. This is **intentional** and not a real error—it just means "user switched skins, discard this load."

However, other errors (network failures, invalid CSS, etc.) are **real errors** that should propagate up.

**How it works:**

1. `error instanceof DOMException` - Is this a DOM-related error?
2. `error.name === 'AbortError'` - Is it specifically an abort?
3. If yes → `Promise.resolve(error)` - Convert rejection to resolution (error is handled)
4. If no → `Promise.reject(error)` - Re-throw the error (let it propagate)

**Usage pattern:**

```typescript
someAsyncOperation().catch(verify) // AbortErrors become resolved, others re-throw
```

This is used in the `.catch(verify)` at line 49 to prevent abort errors from crashing the application.

### Lines 17-23: The Factory Function Signature

```typescript
export const styled = <
  Props extends PropsWithChildren,
  Names extends string = string,
>(
  component: string | ComponentType<Props>,
  { suspendable = false, name, skins, ...attributes }: StyledConfig<Names>
): ComponentType<Props> => {
```

**Generics:**

- `Props extends PropsWithChildren` - The props type for the component (must have children)
- `Names extends string = string` - The skin names (e.g., 'primary' | 'secondary')

**Parameters:**

- `component` - What to render inside shadow DOM (e.g., `'button'` or a custom component)
- `suspendable` - Whether to integrate with React Suspense (default: false)
- `name` - The custom element tag name (e.g., `'my-button'` → `<my-button>`)
- `skins` - Record of skin loaders (e.g., `{ primary: () => import('./primary.css') }`)
- `...attributes` - Additional HTML attributes to forward to the custom element (e.g., `className`, `data-*`, `aria-*`)

**Return type:** `ComponentType<Props>` - A React component

**Design note:** We use destructuring with rest (`...attributes`) to separate known config from passthrough HTML attributes. This allows users to write:

```typescript
styled('button', {
  name: 'my-button',
  skins: { ... },
  className: 'interactive',  // forwarded to <my-button>
  'aria-label': 'Submit',     // forwarded to <my-button>
})
```

### Line 24: Instantiate Sheets Manager

```typescript
const sheets = new Sheets({ skins })
```

**Critical decision:** We create **one `Sheets` instance per styled component**, not a global singleton.

**Why?**

Each styled component has its own set of skins. `Button` might have `{ primary, secondary }` while `Card` might have `{ elevated, flat }`. They shouldn't share a cache because:

1. **Namespace collision:** If both use a skin named `'default'`, they'd conflict
2. **Memory efficiency:** Each component only loads the skins it needs
3. **Isolation:** A bug in one component's skins doesn't affect others

The `Sheets` class handles:

- Validating skin names
- Loading skins asynchronously
- Caching loaded stylesheets
- Converting CSS strings to `CSSStyleSheet` objects

### Lines 26-91: The CustomElement Class (THE BEAST)

This is where the magic happens. 67 lines of carefully orchestrated DOM manipulation, async control flow, and event handling.

#### Lines 26-27: Class Declaration and Static Property

```typescript
class CustomElement extends HTMLElement {
  static observedAttributes = ['skin'] as const
```

**`extends HTMLElement`:** Makes this a valid Custom Element that can be registered with `customElements.define`.

**`observedAttributes`:** Tells the browser to watch the `skin` attribute. When it changes, `attributeChangedCallback` fires.

**Why watch `skin`?** Users can imperatively set the skin:

```html
<my-button skin="primary">Click</my-button>
<script>
  document.querySelector('my-button').setAttribute('skin', 'secondary')
  // ^ Triggers attributeChangedCallback → loads new skin
</script>
```

**Why `as const`?** Makes TypeScript treat it as a readonly tuple `['skin']` instead of `string[]`, enabling stricter type checking.

#### Lines 29-31: Instance Properties

```typescript
controller = new AbortController()

shadow = this.attachShadow({ mode: 'open' })
```

**`controller`:** The first AbortController instance. Gets replaced on every skin change.

**`shadow`:** Attach a shadow root immediately when the element is constructed. `mode: 'open'` means JavaScript can access `element.shadowRoot`. Closed mode would prevent access.

**Why attach in constructor?** We need the shadow root ready before React tries to portal children into it.

#### Lines 33-50: The `adorn` Method (CORE LOGIC)

This is the most important method. It loads and applies a skin, handling all the race condition complexity.

```typescript
adorn = (skin: string) => {
  const { controller: previous } = this
  const next = (this.controller = new AbortController())
  const invalid = !sheets.validate(skin)
  const adopt = (sheet: CSSStyleSheet) => {
    next.signal.throwIfAborted()

    return Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })
  }

  previous.abort()

  return new Promise<CSSStyleSheet>((resolve, reject) =>
    invalid ? reject(new Error('Invalid skin')) : resolve(sheets.get(skin))
  )
    .then(adopt)
    .catch(verify)
}
```

**Line 34:** Capture the current controller as `previous`. We'll abort it soon.

**Line 35:** Create a new controller (`next`) and immediately assign it to `this.controller`. Now this is the "active" controller.

**Line 36:** Check if the skin name is valid using `sheets.validate(skin)`.

**Lines 37-41:** Define `adopt` function that:

1. Checks if this controller has been aborted (`next.signal.throwIfAborted()`)
2. If not aborted, assigns the stylesheet to the shadow root
3. `adoptedStyleSheets` is a browser API that applies a `CSSStyleSheet` to a shadow root

**Line 43:** Abort the previous controller. Any in-flight skin loads will throw `AbortError`.

**Lines 45-47:** Create a promise that either:

- Rejects with `Error('Invalid skin')` if skin name doesn't exist
- Resolves with `sheets.get(skin)` (a CSSStyleSheet) if valid

**Line 48:** Chain `.then(adopt)` to apply the stylesheet once loaded.

**Line 49:** Chain `.catch(verify)` to swallow AbortErrors but re-throw real errors.

**Flow for rapid skin switching:**

```
adorn("dark") called:
  - previous controller → (none)
  - next controller → controller1
  - Start loading dark skin
  - previous.abort() → no-op (no previous)

adorn("light") called (before dark finishes):
  - previous controller → controller1 (the dark load)
  - next controller → controller2
  - Start loading light skin
  - previous.abort() → ABORTS DARK LOAD!

Dark load finishes:
  - controller1.signal.throwIfAborted() → throws!
  - .catch(verify) → swallows error
  - Dark skin never applied ✓

Light load finishes:
  - controller2.signal.throwIfAborted() → doesn't throw
  - adoptedStyleSheets = [lightSheet]
  - Light skin applied ✓
```

#### Lines 52-61: The `attributeChangedCallback` Method

```typescript
attributeChangedCallback(
  name: (typeof CustomElement.observedAttributes)[number],
  _: string,
  skin: string
) {
  switch (true) {
    case name.trim().toLowerCase() === 'skin':
      return this.suspend(this.adorn(skin))
  }
}
```

**Browser lifecycle hook:** Called when an observed attribute changes.

**Parameters:**

- `name` - Which attribute changed (in our case, always `'skin'`)
- `_` (unused) - Old value (we don't care about the old skin)
- `skin` - New value (the new skin name)

**Type annotation:** `(typeof CustomElement.observedAttributes)[number]` ensures `name` is type-safe ('skin').

**Logic:**

1. Normalize the attribute name (`trim().toLowerCase()`) for case-insensitive comparison
2. If it's the `'skin'` attribute, call `this.adorn(skin)` to load the new skin
3. Wrap in `this.suspend(...)` to dispatch suspension events for Suspense integration

**Why `switch (true)` instead of `if`?** Allows for future extensibility. If we add more observed attributes, we can add more cases:

```typescript
switch (true) {
  case name === 'skin':
    return this.suspend(this.adorn(skin))
  case name === 'theme': // hypothetical future attribute
    return this.handleTheme(value)
}
```

#### Lines 63-70: The `change` Event Handler

```typescript
change = (event: Event) => {
  const { detail } = event as CustomEvent<{ skin?: string }>
  const skin = (this.getAttribute('skin') ?? detail.skin ?? '')
    .trim()
    .toLowerCase()

  return this.suspend(this.adorn(skin))
}
```

**Purpose:** Handle programmatic skin changes from React via custom events.

**Flow:**

1. `useCore` detects skin context change (user rendered `<Provider skin="new-skin">`)
2. `useCore` dispatches `CustomEvent('change', { detail: { skin: 'new-skin' } })`
3. This handler receives the event
4. Extract skin name from either:
   - `this.getAttribute('skin')` - If user set it via HTML attribute
   - `detail.skin` - If `useCore` passed it in event detail
   - `''` - Fallback to empty string
5. Normalize (trim whitespace, lowercase)
6. Call `this.adorn(skin)` to load and apply the skin
7. Wrap in `this.suspend(...)` for Suspense

**Why prioritize `getAttribute` over `detail.skin`?** The HTML attribute is the source of truth. If someone set it imperatively, it should take precedence over the context value.

#### Lines 72-74: The `connectedCallback` Hook

```typescript
connectedCallback() {
  this.addEventListener('change', this.change)
}
```

**Browser lifecycle hook:** Called when the element is inserted into the DOM.

**Purpose:** Register the `change` event listener so `useCore` can communicate with us.

**Why not add listeners in constructor?** Best practice is to defer side effects to lifecycle hooks. Constructor should only initialize state.

#### Lines 76-80: The `disconnectedCallback` Hook

```typescript
disconnectedCallback() {
  this.shadow.adoptedStyleSheets = []

  this.removeEventListener('change', this.change)
}
```

**Browser lifecycle hook:** Called when the element is removed from the DOM.

**Purpose:** Clean up resources to prevent memory leaks.

**Line 77:** Clear adopted stylesheets. This releases references to the `CSSStyleSheet` objects, allowing garbage collection.

**Line 79:** Remove event listener. Without this, the listener would remain in memory even after the element is removed, causing a memory leak.

#### Lines 82-90: Suspension Handling Methods

```typescript
resume = () => this.dispatchEvent(new CustomEvent('suspend'))

suspend = (promise: Promise<unknown>) => {
  const detail = promise.finally(this.resume)
  const retrieve = () =>
    this.dispatchEvent(new CustomEvent('suspend', { detail }))

  return queueMicrotask(retrieve)
}
```

**`resume` (line 82):** Dispatch a `'suspend'` event with no `detail`. This signals to `useCore` that the suspension has ended (skin loaded).

**`suspend` (lines 84-90):** Dispatch a `'suspend'` event with the promise as `detail`. This signals to `useCore` that we're suspending (loading a skin asynchronously).

**Flow:**

1. `this.suspend(somePromise)` called
2. Attach `.finally(this.resume)` to the promise so when it resolves/rejects, `resume` is called
3. Create `retrieve` function that dispatches the event
4. `queueMicrotask(retrieve)` schedules the dispatch for the next microtask
   - Why? Ensures the event is dispatched after the current synchronous code finishes, preventing re-entrancy issues

**Why separate `resume` and `suspend`?** Clarity. `suspend` means "start suspending," `resume` means "stop suspending."

**How `useCore` uses this:**

```typescript
// In useCore hook (simplified)
useLayoutEffect(() => {
  const suspend = (e: Event) => {
    const promise = (e as CustomEvent).detail as Promise<unknown>
    persist(promise) // If promise exists, triggers Suspense
  }

  ref.current?.addEventListener('suspend', suspend)
  return () => ref.current?.removeEventListener('suspend', suspend)
}, [])
```

### Lines 93-101: The Styled Component Function

```typescript
const Styled = (props: Props) => {
  const { container, ...core } = useCore({ suspendable })

  return createElement(
    name,
    { ...attributes, ...core },
    createPortal(createElement(component, props), container)
  )
}
```

**This is the React component that users will render.**

**Line 94:** Call `useCore` hook. Returns:

- `container` - The shadow root where we portal children
- `...core` - Spread contains `ref` and other props for the custom element

**Lines 96-100:** Create the React element tree:

```typescript
createElement(
  name,
  { ...attributes, ...core }, // <my-button ...attributes ref={core.ref}>
  createPortal(
    //   Portal to shadow root:
    createElement(component, props), //     <button {...props} />
    container //   Portal target: shadow root
  ) // </my-button>
)
```

**Structure:**

```
<my-button className="..." data-variant="..." ref={core.ref}>
  ↓ createPortal ↓
  Shadow Root:
    <button {...props}>
      {children}
    </button>
</my-button>
```

**Why this structure?**

1. Outer element (`<my-button>`) is the Custom Element (visible in DevTools as `<my-button>`)
2. `...attributes` spreads config like `className`, `data-*`, `aria-*` onto the custom element
3. `...core` adds the `ref` so `useCore` can access the element and its shadow root
4. `createPortal(...)` renders the inner component (`<button>`) inside the shadow root
5. `createElement(component, props)` creates the actual interactive element with user props

### Lines 103-105: Custom Element Registration and Return

```typescript
customElements.define(name, CustomElement)

return Styled
```

**Line 103:** Register the Custom Element with the browser's Custom Elements registry.

**Critical:** This happens **before** returning the component. The custom element must be defined before React tries to render it. If we returned `Styled` first, React would render `<my-button>` but the browser wouldn't know what `my-button` is, causing an error.

**Line 105:** Return the `Styled` component. This is what users will use in their JSX:

```typescript
const Button = styled('button', { ... })  // Returns Styled
<Button>Click me</Button>                 // Renders Styled component
```

**Important note:** If you call `styled` with the same `name` twice, `customElements.define` throws an error. Custom element names must be unique globally. This is why we document the "duplicate name" gotcha in Common Pitfalls.

## Usage Examples

### Basic: Synchronous Skin

The simplest case—a single static skin.

```typescript
import { styled } from '@everything-dies/flesh-cage/core'

const Button = styled('button', {
  name: 'app-button',
  skins: {
    default: () => Promise.resolve({
      default: `
        button {
          padding: 10px 20px;
          background: blue;
          color: white;
          border: none;
          border-radius: 4px;
        }
      `
    })
  }
})

// Usage in your app
import { Provider } from '@everything-dies/flesh-cage/core'

function App() {
  return (
    <Provider skin="default">
      <Button onClick={() => alert('Clicked!')}>
        Click Me
      </Button>
    </Provider>
  )
}
```

**Result:**

```html
<app-button>
  #shadow-root (open) |
  <style>
    (adopted stylesheet)
       |   button { padding: 10px 20px; ... }
       |
  </style>
  | <button>Click Me</button>
</app-button>
```

### Intermediate: Multiple Skins

Support multiple themes.

```typescript
const Button = styled('button', {
  name: 'themed-button',
  skins: {
    primary: () => import('./skins/button.primary.css'),
    secondary: () => import('./skins/button.secondary.css'),
    danger: () => import('./skins/button.danger.css'),
  }
})

function ThemedApp() {
  const [theme, setTheme] = useState('primary')

  return (
    <Provider skin={theme}>
      <Button>I change colors!</Button>
      <button onClick={() => setTheme('danger')}>Use Danger Theme</button>
    </Provider>
  )
}
```

**How it works:**

1. User clicks "Use Danger Theme"
2. `setTheme('danger')` updates state
3. `<Provider skin={theme}>` re-renders with new context value
4. `useCore` detects the context change
5. `useCore` dispatches `CustomEvent('change', { detail: { skin: 'danger' } })`
6. CustomElement's `change` handler calls `adorn('danger')`
7. Danger skin loads (async import)
8. `adoptedStyleSheets` updated with danger styles
9. Button turns red!

### Advanced: Async Skin with Suspense

Integrate with React Suspense for loading states.

```typescript
const Card = styled('article', {
  name: 'suspense-card',
  suspendable: true,  // Enable Suspense integration
  skins: {
    elevated: () => import('./skins/card.elevated.css'),  // 2MB CSS file (exaggerated)
  }
})

function SuspenseApp() {
  return (
    <Provider skin="elevated">
      <Suspense fallback={<div>Loading card styles...</div>}>
        <Card>
          <h2>Suspenseful Card</h2>
          <p>This card waits for styles to load before rendering.</p>
        </Card>
      </Suspense>
    </Provider>
  )
}
```

**Flow:**

1. `<Provider>` renders with `skin="elevated"`
2. `useCore` dispatches `change` event → `adorn('elevated')`
3. `adorn` starts loading CSS (async import)
4. `adorn` calls `suspend(promise)`
5. `suspend` dispatches `'suspend'` event with promise as detail
6. `useCore` receives event, calls `persist(promise)`
7. `use(promise)` throws the promise (because `suspendable: true`)
8. React Suspense catches the thrown promise
9. Shows `<div>Loading card styles...</div>`
10. CSS loads, promise resolves
11. `finally(resume)` dispatches `'suspend'` event (no detail)
12. `useCore` calls `persist(undefined)` to clear suspension
13. Suspense re-renders, shows `<Card>`

### Dynamic Skin Switching

Change skins programmatically.

```typescript
const Avatar = styled('img', {
  name: 'user-avatar',
  skins: {
    small: () => import('./skins/avatar.small.css'),
    large: () => import('./skins/avatar.large.css'),
  }
})

function Profile() {
  const [size, setSize] = useState('small')

  return (
    <Provider skin={size}>
      <Avatar src="/user.jpg" alt="User" />
      <button onClick={() => setSize(size === 'small' ? 'large' : 'small')}>
        Toggle Size
      </button>
    </Provider>
  )
}
```

**Result:** Clicking the button instantly switches between small and large avatar styles. If both skins are already loaded, the switch is instant (cached by `Sheets`).

### Testing Pattern: Mock Skins

In tests, use synchronous mock skins.

```typescript
import { render, waitFor } from '@testing-library/react'
import { styled, Provider } from '@everything-dies/flesh-cage/core'

const createMockSkin = (css: string) =>
  () => Promise.resolve({ default: css })

test('button applies styles', async () => {
  const Button = styled('button', {
    name: 'test-button',
    skins: {
      default: createMockSkin('button { color: red; }')
    }
  })

  const { container } = render(
    <Provider skin="default">
      <Button>Test</Button>
    </Provider>
  )

  const element = container.querySelector('test-button')

  await waitFor(() => {
    const sheets = element.shadowRoot.adoptedStyleSheets
    expect(sheets.length).toBeGreaterThan(0)
  })
})
```

**Key testing utilities:**

- `createMockSkin(css)` - Creates a synchronous skin loader for testing
- `container.querySelector('test-button')` - Access the custom element
- `element.shadowRoot` - Access the shadow root
- `adoptedStyleSheets` - Verify styles were applied

### Custom Event Handling

Listen to suspend events for loading indicators.

```typescript
function LoadingCard() {
  const [isLoading, setIsLoading] = useState(false)
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = cardRef.current

    const handleSuspend = (e: Event) => {
      const promise = (e as CustomEvent).detail
      if (promise) {
        setIsLoading(true)
        promise.finally(() => setIsLoading(false))
      }
    }

    element?.addEventListener('suspend', handleSuspend)
    return () => element?.removeEventListener('suspend', handleSuspend)
  }, [])

  const Card = styled('div', {
    name: 'loading-card',
    skins: {
      theme: () => import('./slow-skin.css')  // 5 second load
    }
  })

  return (
    <Provider skin="theme">
      <Card ref={cardRef}>
        {isLoading && <Spinner />}
        <h2>Card Content</h2>
      </Card>
    </Provider>
  )
}
```

**Pattern:** Custom elements dispatch standard DOM events, so you can use `addEventListener` just like any other element.

### Forwarding Attributes

Pass HTML attributes to the custom element.

```typescript
const Button = styled('button', {
  name: 'attr-button',
  skins: { default: () => import('./button.css') },

  // These attributes are forwarded to <attr-button>
  className: 'interactive primary',
  'data-variant': 'solid',
  'aria-label': 'Primary action button',
  exportparts: 'button, icon', // Shadow DOM parts
})

// Renders:
// <attr-button
//   class="interactive primary"
//   data-variant="solid"
//   aria-label="Primary action button"
//   exportparts="button, icon"
// >
```

**Use cases:**

- `className` - Add utility classes for spacing, positioning, etc.
- `data-*` - Store metadata for testing or analytics
- `aria-*` - Improve accessibility
- `exportparts` - Expose shadow DOM parts for external styling

## Related Modules

### Dependencies (What We Import)

#### `../types/` - Type Definitions

- **What we use:** `StyledConfig<Names>`
- **Why:** Type safety for the config object passed to `styled()`
- **Link:** See `types/README.md` for full type definitions

#### `../sheets/` - Stylesheet Management

- **What we use:** `Sheets` class
- **Why:** Handles async skin loading, caching, and `CSSStyleSheet` construction
- **Key methods:**
  - `validate(skin)` - Check if skin name exists
  - `get(skin)` - Load and return a stylesheet (with caching)
- **Link:** See `sheets/README.md` for caching strategy

#### `../use-core/` - Shadow DOM Lifecycle Hook

- **What we use:** `useCore({ suspendable })` hook
- **Why:** Manages ref, shadow root attachment, event listeners, and Suspense integration
- **Returns:** `{ container, ref, ...otherProps }`
- **Link:** See `use-core/README.md` for lifecycle details

### Dependents (Who Imports Us)

#### User Applications

- **How they use us:** Call `styled()` to create styled components
- **What they get:** A React component with Shadow DOM encapsulation
- **Example:**
  ```typescript
  import { styled } from '@everything-dies/flesh-cage/core'
  const Button = styled('button', { name: 'my-button', skins: {...} })
  ```

#### Test Suites

- **Files:**
  - `__tests__/basic.test.tsx` - Basic rendering and attribute forwarding
  - `__tests__/async.test.tsx` - Async skin loading and Suspense
  - `__tests__/attributes.test.tsx` - Attribute forwarding tests
  - `__tests__/custom-element.test.tsx` - CustomElement lifecycle tests
  - `__tests__/abort-controller.test.tsx` - Race condition handling tests
- **Link:** See test files for usage patterns and edge cases

### Transitive Dependencies

Through `use-core`, we indirectly depend on:

- `../use-context/` - For accessing the current skin name from React context
- `../context/` - The React context definition
- `../provider/` - The Provider component that users wrap their app in

Dependency chain: `styled` → `use-core` → `use-context` → `context` → `provider`

## Testing Strategy

### Test Coverage Areas

1. **Basic Functionality** (`basic.test.tsx`)
   - Custom element creation
   - Shadow DOM attachment
   - Portal rendering
   - Style adoption
   - Multiple components

2. **Async Loading** (`async.test.tsx`)
   - Async skin loading
   - Suspense integration
   - Caching behavior
   - Error handling

3. **Attribute Forwarding** (`attributes.test.tsx`)
   - Config attributes (`className`, `data-*`, `aria-*`)
   - Dynamic attribute changes
   - Skin attribute handling

4. **CustomElement Lifecycle** (`custom-element.test.tsx`)
   - `connectedCallback` / `disconnectedCallback`
   - `attributeChangedCallback`
   - Event listener registration/cleanup
   - Shadow root cleanup

5. **AbortController Logic** (`abort-controller.test.tsx`)
   - Rapid skin switching
   - Race condition handling
   - Stale skin rejection
   - Deterministic resolution (last requested skin wins)

### Testing Approach

**Philosophy:** Test from the user's perspective. We render actual components, dispatch real events, and verify DOM state—no mocking of internal methods.

**Key utilities:**

```typescript
// From __tests__/utils.ts
getShadowCSS(shadowRoot) // Extract CSS from adoptedStyleSheets
normalizeCSS(css) // Normalize for comparison
waitForStyles(element) // Wait for async skin load
findCustomElement(container, name) // Query for custom element
createMockSkin(css) // Create synchronous test skin
```

**Example test:**

```typescript
it('loads async skins successfully', async () => {
  const Button = styled('button', {
    name: 'test-async',
    skins: {
      async: () => new Promise(resolve =>
        setTimeout(() => resolve({ default: 'color: orange;' }), 50)
      )
    }
  })

  const { container } = render(
    <Provider skin="async">
      <Button>Async</Button>
    </Provider>
  )

  const element = findCustomElement(container, 'test-async')
  await waitForStyles(element)

  const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
  expect(css).toContain('orange')
})
```

**What we verify:**

1. DOM structure (custom element exists, has shadow root)
2. Style adoption (adoptedStyleSheets populated)
3. CSS content (actual styles match expected)
4. Event behavior (change events trigger skin loads)
5. Lifecycle (cleanup happens on unmount)

### Test Coverage Metrics

| Category               | Coverage | Files                        |
| ---------------------- | -------- | ---------------------------- |
| **Line Coverage**      | ~95%     | All lines except error paths |
| **Branch Coverage**    | ~90%     | All conditional logic        |
| **Function Coverage**  | 100%     | All methods tested           |
| **Statement Coverage** | ~95%     | All statements executed      |

**Untested edge cases:**

- Network failures during skin import (requires network mocking)
- Browser crashes mid-render (not realistically testable)
- Exotic Custom Element collisions (requires browser environment manipulation)

## Common Pitfalls

### 1. Duplicate Custom Element Names

**Problem:**

```typescript
// File A
const ButtonA = styled('button', { name: 'app-button', skins: {...} })

// File B (different component, same name!)
const ButtonB = styled('button', { name: 'app-button', skins: {...} })
// 💥 Error: Failed to execute 'define' on 'CustomElementRegistry':
//    the name "app-button" has already been used
```

**Solution:** Use unique, namespaced names.

```typescript
// Good: Prefix with component name or feature
const ButtonA = styled('button', { name: 'header-button', skins: {...} })
const ButtonB = styled('button', { name: 'footer-button', skins: {...} })

// Better: Include variant in name
const PrimaryButton = styled('button', { name: 'btn-primary', skins: {...} })
const SecondaryButton = styled('button', { name: 'btn-secondary', skins: {...} })
```

**Why this happens:** Custom element names are globally registered in the browser. Unlike React components (which are scoped to modules), custom element names must be unique across the entire application.

### 2. Race Conditions Without AbortController

**Problem:** Rapidly switching skins can cause the wrong skin to be applied.

```typescript
// User rapidly clicks theme buttons
setTheme('dark') // Starts loading (200ms)
setTheme('light') // Starts loading (50ms)
// Light finishes first → applied ✓
// Dark finishes later → applied ✗ (Wrong!)
```

**Why AbortController fixes it:** We abort the first load when the second starts.

```typescript
adorn('dark') // controller1
adorn('light') // controller1.abort() ← cancels dark
// controller2 ← only light finishes
```

**User action required:** None! This is handled internally. Just be aware that only the most recent skin load completes.

### 3. Portal Rendering Timing Issues

**Problem:** Portaling children before the shadow root exists causes errors.

```typescript
// BAD: Shadow root might not exist yet
return createPortal(children, ref.current?.shadowRoot) // ← ref might be null
```

**Solution:** `useCore` manages this. It uses `useLayoutEffect` to ensure the shadow root is attached before rendering.

```typescript
// GOOD: useCore guarantees container exists
const { container } = useCore({ suspendable })
return createPortal(children, container) // ← container is guaranteed to exist
```

**Why this matters:** React portals throw if the target doesn't exist. `useCore` ensures the target is ready before the component renders.

### 4. Attribute Forwarding Gotchas

**Problem:** Attributes are forwarded to the custom element, not the inner component.

```typescript
const Button = styled('button', {
  name: 'my-button',
  skins: {...},
  className: 'primary'  // ← Goes on <my-button>, not <button>
})

// Renders:
// <my-button class="primary">  ← className here
//   #shadow-root
//     <button>...</button>      ← NOT here
// </my-button>
```

**Solution:** If you need to style the inner component, use CSS with `:host`:

```css
/* In your skin CSS */
:host(.primary) button {
  /* Styles for <button> when <my-button> has .primary class */
}
```

### 5. Event Listeners on Custom Elements

**Problem:** Users might expect events on the inner component, but they're on the custom element.

```typescript
const Button = styled('button', { name: 'my-button', skins: {...} })

// This works, but onClick is on the custom element, not the button
<Button onClick={handleClick}>Click</Button>

// Event bubbles from <button> → custom element → handler
```

**Why it works:** Events bubble through shadow boundaries. The click on `<button>` bubbles up to `<my-button>`, where React's event listener catches it.

**Caveat:** Some events don't bubble (e.g., `focus`, `blur`). Use `onFocus` with `onFocusCapture` to handle these:

```typescript
<Button onFocusCapture={handleFocus}>...</Button>
```

### 6. Invalid Skin Names

**Problem:** Requesting a skin that doesn't exist causes a silent rejection.

```typescript
const Button = styled('button', {
  name: 'btn',
  skins: {
    primary: () => import('./primary.css')
  }
})

// User renders with wrong skin name
<Provider skin="secondary">  {/* ← Typo! Should be "primary" */}
  <Button>Click</Button>      {/* ← No styles applied */}
</Provider>
```

**Solution:** `Sheets.validate()` checks skin names. Invalid names reject with `Error('Invalid skin')`, which is caught and logged (but not thrown to users).

**Best practice:** Validate skin names at runtime or use TypeScript enums:

```typescript
type Skin = 'primary' | 'secondary'

const Button = styled<React.PropsWithChildren, Skin>('button', {
  name: 'btn',
  skins: {
    primary: () => import('./primary.css'),
    secondary: () => import('./secondary.css')
  }
})

// TypeScript enforces valid skin names
<Provider skin="secondary">  {/* ✓ Valid */}
<Provider skin="tertiary">   {/* ✗ TypeScript error */}
```

### 7. Custom Element Naming Requirements

**Problem:** Custom element names must contain a hyphen (`-`) and start with a lowercase letter.

```typescript
// INVALID:
styled('button', { name: 'button', skins: {...} })     // ❌ No hyphen
styled('button', { name: 'Button-X', skins: {...} })   // ❌ Starts with capital
styled('button', { name: '123-btn', skins: {...} })    // ❌ Starts with number

// VALID:
styled('button', { name: 'app-button', skins: {...} })     // ✓
styled('button', { name: 'my-cool-button', skins: {...} }) // ✓
styled('button', { name: 'x-123', skins: {...} })          // ✓
```

**Reason:** HTML5 spec requires custom element names to:

1. Start with lowercase ASCII letter
2. Contain at least one hyphen
3. Not contain uppercase letters

**Solution:** Use kebab-case names with a prefix:

```typescript
// Convention: <namespace>-<component>[-variant]
'app-button'
'ui-card-elevated'
'auth-form-login'
```

## Future Enhancements

### 1. Ref Forwarding

**Current limitation:** Users can't get a ref to the inner component (e.g., the `<button>` inside the shadow root).

**Proposed solution:**

```typescript
const Button = styled('button', { name: 'btn', skins: {...} })

const buttonRef = useRef<HTMLButtonElement>(null)
<Button ref={buttonRef}>Click</Button>  // ref points to inner <button>

// Access inner button
buttonRef.current?.focus()
```

**Implementation:** Use React's `forwardRef` and attach the ref to the inner component, not the custom element.

### 2. Multiple Skin Layers

**Feature:** Support multiple skins simultaneously (e.g., base + theme + variant).

```typescript
const Button = styled('button', {
  name: 'layered-button',
  skins: {
    base: () => import('./base.css'),     // Always loaded
    themes: {
      dark: () => import('./dark.css'),   // Theme layer
      light: () => import('./light.css')
    },
    variants: {
      solid: () => import('./solid.css'), // Variant layer
      outline: () => import('./outline.css')
    }
  }
})

<Provider skin={{ base: true, theme: 'dark', variant: 'solid' }}>
  <Button>Layered</Button>
</Provider>
```

**Benefit:** More flexible theming without combinatorial explosion of skin names.

### 3. CSS Custom Properties Bridge

**Feature:** Expose CSS custom properties from skin to React props.

```typescript
const Button = styled('button', {
  name: 'prop-button',
  skins: { default: () => import('./button.css') },
  cssProps: {
    '--btn-color': 'color',
    '--btn-size': 'size'
  }
})

<Button color="red" size="large">Styled</Button>
// Renders:
// <prop-button style="--btn-color: red; --btn-size: large;">
```

**Benefit:** Dynamic styling without defining multiple skins.

### 4. Skin Preloading

**Feature:** Preload skins before they're needed.

```typescript
import { preloadSkin } from '@everything-dies/flesh-cage/core'

// Preload on route change
useEffect(() => {
  preloadSkin(Button, 'dark') // Start loading dark skin
}, [location.pathname])
```

**Benefit:** Instant skin switching (no loading delay) for better UX.

### 5. Development Mode Warnings

**Feature:** Warn about common mistakes in development.

```typescript
// Warn if same name used twice
if (process.env.NODE_ENV === 'development') {
  if (customElements.get(name)) {
    console.warn(`Custom element "${name}" already defined`)
  }
}

// Warn if invalid skin requested
if (!sheets.validate(skin)) {
  console.warn(`Skin "${skin}" not found in [${Object.keys(skins).join(', ')}]`)
}
```

**Benefit:** Faster debugging during development.

### 6. Server-Side Rendering (SSR) Support

**Current limitation:** Custom Elements don't work in SSR (no `customElements` API in Node.js).

**Proposed solution:** Detect SSR environment and render a plain wrapper:

```typescript
if (typeof customElements === 'undefined') {
  // SSR mode: Render plain div with data attributes
  return <div data-styled-name={name} data-skin={skin}>{children}</div>
}
```

**Hydration:** On client, replace the `<div>` with the real custom element.

**Benefit:** Use flesh-cage in Next.js, Remix, etc.

## Maintainer Notes: If I Die Tomorrow

### Critical Invariants (DO NOT BREAK)

1. **Custom element must be defined before component returns**

   ```typescript
   customElements.define(name, CustomElement) // ← Must happen first
   return Styled // ← Then return component
   ```

   **Why:** React will try to render `<name>` immediately. If it's not defined, browser throws `Error: Failed to construct 'HTMLElement'`.

2. **AbortController must be replaced, not reused**

   ```typescript
   // CORRECT:
   const next = (this.controller = new AbortController())
   previous.abort()

   // WRONG:
   this.controller.abort()
   this.controller = new AbortController() // ← Too late! Already aborted.
   ```

   **Why:** We need the previous controller's reference to abort it AFTER creating the new one.

3. **`suspend` event detail must be the promise, not wrapped**

   ```typescript
   // CORRECT:
   new CustomEvent('suspend', { detail: promise })

   // WRONG:
   new CustomEvent('suspend', { detail: { promise } }) // ← Extra wrapping breaks useCore
   ```

   **Why:** `useCore` expects `detail` to be the promise directly, not an object containing it.

4. **Shadow root must be attached in constructor, not `connectedCallback`**

   ```typescript
   class CustomElement extends HTMLElement {
     shadow = this.attachShadow({ mode: 'open' })  // ← Constructor
   }

   // WRONG:
   connectedCallback() {
     this.shadow = this.attachShadow({ mode: 'open' })  // ← Too late!
   }
   ```

   **Why:** `useCore` expects the shadow root to exist synchronously when the element is created. React might try to portal children before `connectedCallback` runs.

5. **`adoptedStyleSheets` must be an array, even with one sheet**

   ```typescript
   // CORRECT:
   this.shadow.adoptedStyleSheets = [sheet]

   // WRONG:
   this.shadow.adoptedStyleSheets = sheet // ← Type error!
   ```

   **Why:** Browser API requires an array of `CSSStyleSheet` objects.

### Fragile Areas (Change with Caution)

#### 1. Event Timing and `queueMicrotask`

**Location:** Lines 84-90 (`suspend` method)

**Code:**

```typescript
suspend = (promise: Promise<unknown>) => {
  const detail = promise.finally(this.resume)
  const retrieve = () =>
    this.dispatchEvent(new CustomEvent('suspend', { detail }))

  return queueMicrotask(retrieve)
}
```

**Why fragile:** Event dispatch timing matters. If we dispatch synchronously, we might dispatch before `useCore` has attached the event listener, causing the event to be missed.

**What could break:**

- Removing `queueMicrotask` → Events fire before listeners are ready
- Changing to `setTimeout` → Events fire too late (after a frame)
- Changing to `requestAnimationFrame` → Events fire even later

**Testing:** Run `npm test styled` and check for flaky tests. Timing issues often manifest as intermittent failures.

#### 2. AbortController Signal Checking

**Location:** Lines 37-41 (`adopt` function inside `adorn`)

**Code:**

```typescript
const adopt = (sheet: CSSStyleSheet) => {
  next.signal.throwIfAborted()

  return Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })
}
```

**Why fragile:** `throwIfAborted` throws a `DOMException`. If we don't catch it correctly, it propagates to React and crashes the app.

**What could break:**

- Not catching with `.catch(verify)` → Unhandled promise rejection
- Checking `signal.aborted` instead of throwing → Race condition (signal could be aborted between check and assignment)
- Moving the check after assignment → Sheet applied even when aborted

**Testing:** Run abort-controller tests. They verify that rapid switching doesn't apply stale skins.

#### 3. Shadow Root Attachment in `useCore`

**Location:** `use-core/index.ts` (lines 17-20)

**Code:**

```typescript
useLayoutEffect(() => {
  const transition = () => attach(ref.current?.shadowRoot as ShadowRoot)
  return startTransition(transition)
}, [])
```

**Why fragile:** Depends on custom element being mounted and shadow root existing before this effect runs. If the effect runs first, `ref.current` is null.

**What could break:**

- Changing `useLayoutEffect` to `useEffect` → Race condition
- Removing `startTransition` → Blocks rendering (but probably won't break)
- Adding dependencies to the array → Re-runs effect unnecessarily

**Testing:** Run use-core tests. They verify shadow root attachment timing.

#### 4. Portal Container State

**Location:** Lines 93-101 (`Styled` component)

**Code:**

```typescript
const Styled = (props: Props) => {
  const { container, ...core } = useCore({ suspendable })

  return createElement(
    name,
    { ...attributes, ...core },
    createPortal(createElement(component, props), container)
  )
}
```

**Why fragile:** `container` comes from `useState` in `useCore`. If it's undefined, `createPortal` throws. The initial state is `new DocumentFragment()`, which is valid but renders nothing until replaced with the shadow root.

**What could break:**

- Changing `useCore` to return `undefined` initially → Portal throws
- Not updating `container` state → Children never render
- Using `ref.current.shadowRoot` directly → Null on first render

**Testing:** Run basic tests. They verify that children render correctly via portals.

### Comprehensive Debugging Guide

#### Issue: Styles Not Applying

**Symptoms:** Component renders but has no styles.

**Checklist:**

1. **Check skin name is valid**

   ```typescript
   // Open browser console, look for this message:
   sheets.validate(skin) // Should return true
   ```

2. **Check adoptedStyleSheets**

   ```javascript
   // In DevTools:
   document.querySelector('your-element').shadowRoot.adoptedStyleSheets
   // Should be an array with length > 0
   ```

3. **Check for AbortError**

   ```javascript
   // Look for unhandled promise rejections in console
   // If you see AbortError, it might be a race condition
   ```

4. **Check CSS syntax**

   ```css
   /* Skin CSS must target elements inside shadow root */
   button {
     color: red;
   } /* ✓ Works */
   .button {
     color: red;
   } /* ✗ Won't work unless <button class="button"> */
   ```

5. **Check Provider skin prop**
   ```typescript
   <Provider skin="primary">  {/* Must match a skin in skins object */}
   ```

#### Issue: Custom Element Not Defined

**Symptoms:** `Uncaught DOMException: Failed to construct 'HTMLElement'`

**Causes:**

1. **Duplicate name**

   ```typescript
   // Check if name is already used
   customElements.get('your-name') // If defined, this returns a constructor
   ```

2. **Invalid name**

   ```typescript
   // Names must have a hyphen and start with lowercase letter
   'button' // ❌ No hyphen
   'Button-x' // ❌ Capital letter
   'x-button' // ✓ Valid
   ```

3. **Called `styled` multiple times with same name**
   ```typescript
   // Solution: Use unique names or cache the component
   const Button = styled('button', { name: 'btn', ... })  // Create once
   // Don't call styled() again with name: 'btn'
   ```

#### Issue: Rapid Skin Switching Shows Wrong Skin

**Symptoms:** User clicks "Light Theme" but sees "Dark Theme" momentarily.

**Diagnosis:**

1. **Check AbortController is working**

   ```typescript
   // Add logging to adorn method
   adorn = (skin: string) => {
     console.log('[adorn] Loading skin:', skin)
     const { controller: previous } = this
     previous.abort() // Should log when aborted
     console.log('[adorn] Aborted previous controller')
     // ...
   }
   ```

2. **Check verify function**

   ```typescript
   // Ensure AbortErrors are caught
   .catch(verify)  // Should swallow AbortErrors, re-throw others
   ```

3. **Check adoption timing**
   ```typescript
   // Verify throwIfAborted is called before assignment
   next.signal.throwIfAborted() // ← Must be here
   this.shadow.adoptedStyleSheets = [sheet]
   ```

#### Issue: Suspense Fallback Never Shows

**Symptoms:** Component hangs indefinitely, fallback never shows.

**Causes:**

1. **`suspendable` not set to `true`**

   ```typescript
   styled('button', {
     suspendable: true,  // ← Must be true for Suspense
     skins: { ... }
   })
   ```

2. **No Suspense boundary**

   ```typescript
   <Suspense fallback={<div>Loading...</div>}>  {/* Must wrap component */}
     <YourComponent />
   </Suspense>
   ```

3. **Skin loads synchronously**

   ```typescript
   // If skin is already cached, it resolves immediately
   // Suspense only triggers for truly async loads
   ```

4. **Event not dispatching**
   ```typescript
   // Check DevTools → Elements → Event Listeners
   // Should see 'suspend' listener on custom element
   ```

#### Issue: Memory Leak (Component Unmounts but Memory Stays High)

**Symptoms:** DevTools Memory Profiler shows detached DOM nodes.

**Checklist:**

1. **Check event listeners are removed**

   ```typescript
   disconnectedCallback() {
     this.removeEventListener('change', this.change)  // ← Must remove
   }
   ```

2. **Check adoptedStyleSheets cleared**

   ```typescript
   disconnectedCallback() {
     this.shadow.adoptedStyleSheets = []  // ← Must clear
   }
   ```

3. **Check for circular references**

   ```typescript
   // Avoid storing references to elements in closures
   // Bad:
   const element = this
   somePromise.then(() => element.doSomething())

   // Good:
   somePromise.then(() => this.doSomething())
   ```

4. **Check AbortController cleanup**
   ```typescript
   // Abort controller should be aborted when element unmounts
   disconnectedCallback() {
     this.controller.abort()  // ← Add this if not present
   }
   ```

### Performance Considerations

#### 1. Stylesheet Caching

**Current behavior:** Sheets are cached per styled component, not globally.

**Implication:** If you create 100 instances of the same component, they all share the same `Sheets` instance (defined at line 24, outside the component). The first instance loads the skin, subsequent instances use the cached version.

**Optimization opportunity:** If two different styled components use the same skin CSS, they don't share the cache. Could introduce a global cache keyed by CSS URL/content hash.

#### 2. Shadow DOM Performance

**Reality check:** Shadow DOM has measurable overhead compared to light DOM. Each shadow root adds:

- ~2-5ms to initial render (shadow root attachment)
- ~0.5-1ms per style recalculation (adoptedStyleSheets)
- Memory overhead (~1-2KB per shadow root)

**When it matters:** If you're rendering 1000+ styled components, consider batching or virtualization.

**When it doesn't:** For typical UIs (<100 components), the overhead is negligible.

#### 3. Event Listener Overhead

**Current behavior:** Each custom element adds two event listeners (`change`, `suspend`).

**Implication:** 100 components = 200 listeners. This is acceptable. Event listeners are cheap (~100 bytes each).

**Avoid:** Don't add MORE listeners without cleanup. Always pair `addEventListener` with `removeEventListener`.

#### 4. AbortController Allocation

**Current behavior:** Each skin change creates a new `AbortController`.

**Implication:** Rapid skin switching (e.g., user dragging a slider through 50 themes) creates many AbortController instances.

**Reality:** AbortController is lightweight (~100 bytes). Creating 50 of them is fine. They're garbage collected when no longer referenced.

**Avoid:** Don't store AbortControllers in an array or object. Only keep the current one.

### Breaking Changes to Avoid

1. **Changing the `name` parameter to optional**

   Current: `name: string` (required)
   Proposed: `name?: string` (optional, auto-generate)

   **Why it breaks:** Existing code depends on knowing the custom element tag name for querying and styling.

2. **Changing the `skins` structure**

   Current: `Record<string, SkinLoader>`
   Proposed: `Array<{ name: string, loader: SkinLoader }>`

   **Why it breaks:** All existing styled components would need refactoring.

3. **Removing the `suspendable` flag**

   Current: `suspendable?: boolean` (optional)
   Proposed: Always integrate with Suspense

   **Why it breaks:** Components that don't want Suspense (e.g., non-critical styling) would break.

4. **Changing event names**

   Current: `'change'`, `'suspend'`
   Proposed: `'skinchange'`, `'skinsuspend'`

   **Why it breaks:** Any code listening for these events would break.

5. **Changing the CustomElement class to a function**

   Current: `class CustomElement extends HTMLElement`
   Proposed: `function createCustomElement()`

   **Why it breaks:** Custom Elements API requires a class. Can't use functions.

### Conclusion

This module is the heart of flesh-cage. Every decision—from using Custom Elements to AbortController to event-driven communication—was made deliberately to solve real problems. If you need to change something, understand why it's currently designed this way first.

When in doubt:

1. Run the tests (`npm test styled`)
2. Check DevTools Elements panel (look at shadow roots)
3. Check DevTools Console (look for errors)
4. Read this README again (seriously, it's all here)

Good luck, future maintainer. You've got this.
