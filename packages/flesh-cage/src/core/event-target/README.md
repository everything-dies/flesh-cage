# EventTarget - Shared Event Bus

## Overview

The `event-target/` module exports a single shared `EventTarget` instance for global event-based communication within the flesh-cage system.

**Purpose:** Provide a central event bus for components that need to communicate without direct references to each other.

**Lines of code:** 1 line

**Complexity level:** MINIMAL - This is a simple singleton pattern.

**Dependencies:**

- None (uses native browser API)

**Dependents:**

- `../use-meta/` - Would use this for loading state events (currently disabled)

## Implementation

```typescript
export const EventTarget = new window.EventTarget()
```

This creates a single `EventTarget` instance that persists for the lifetime of the application. Components can import this instance and use it to dispatch and listen for events.

## Philosophy & Design Decisions

### Why a Shared EventTarget?

**Decision:** Export a pre-instantiated `EventTarget` rather than a factory or class.

**Rationale:**

1. **Singleton pattern:** All components need to communicate through the same instance. Creating multiple instances would defeat the purpose.

2. **Zero configuration:** Consumers just import and use it. No setup required.

3. **Standard API:** `EventTarget` is a native browser API. No custom abstractions needed.

**Rejected alternatives:**

- **Export class:** Would require consumers to manage their own instances, breaking shared communication
- **Factory function:** Adds complexity for no benefit
- **Custom event emitter:** Reinvents the wheel; native API is sufficient

### Why `window.EventTarget`?

```typescript
new window.EventTarget()
```

**Decision:** Explicitly use `window.EventTarget` instead of just `EventTarget`.

**Rationale:**

1. **Clarity:** Makes it explicit that we're using the browser's native `EventTarget`, not a custom implementation.

2. **SSR safety:** In server-side rendering contexts, `EventTarget` might not be globally available. Explicitly referencing `window.EventTarget` makes the browser dependency clear.

## Usage Examples

### Dispatching Events

```typescript
import { EventTarget } from '@everything-dies/flesh-cage/core/event-target'

// Dispatch a custom event
EventTarget.dispatchEvent(
  new CustomEvent('skin-loaded', {
    detail: { skin: 'dark', duration: 150 },
  })
)
```

### Listening for Events

```typescript
import { EventTarget } from '@everything-dies/flesh-cage/core/event-target'

// Add event listener
const handleSkinLoaded = (event: Event) => {
  const { detail } = event as CustomEvent
  console.log(`Skin ${detail.skin} loaded in ${detail.duration}ms`)
}

EventTarget.addEventListener('skin-loaded', handleSkinLoaded)

// Clean up when done
EventTarget.removeEventListener('skin-loaded', handleSkinLoaded)
```

### Using with React useEffect

```typescript
import { useEffect } from 'react'
import { EventTarget } from '@everything-dies/flesh-cage/core/event-target'

function SkinLoadMonitor() {
  useEffect(() => {
    const handler = (event: Event) => {
      console.log('Skin event:', (event as CustomEvent).detail)
    }

    EventTarget.addEventListener('skin-loaded', handler)

    // Clean up on unmount
    return () => {
      EventTarget.removeEventListener('skin-loaded', handler)
    }
  }, [])

  return null
}
```

## Common Pitfalls

### 1. Memory Leaks from Forgotten Listeners

**Problem:** Adding listeners without removing them.

```typescript
// ❌ BAD: Listener never removed
useEffect(() => {
  EventTarget.addEventListener('skin-loaded', handleLoad)
  // No cleanup!
}, [])
```

**Solution:** Always return a cleanup function.

```typescript
// ✅ GOOD: Listener removed on unmount
useEffect(() => {
  EventTarget.addEventListener('skin-loaded', handleLoad)
  return () => EventTarget.removeEventListener('skin-loaded', handleLoad)
}, [])
```

### 2. Assuming Event Order

**Problem:** Relying on specific event dispatch order.

```typescript
// ❌ BAD: Assuming events arrive in order
EventTarget.dispatchEvent(new CustomEvent('step-1'))
EventTarget.dispatchEvent(new CustomEvent('step-2'))
// Listeners might not process in this order
```

**Solution:** Use a single event with all data, or implement explicit sequencing.

### 3. Forgetting Event Type Casting

**Problem:** Accessing `detail` on base `Event` type.

```typescript
// ❌ BAD: TypeScript error - Event has no 'detail'
EventTarget.addEventListener('skin-loaded', (event) => {
  console.log(event.detail) // Error!
})
```

**Solution:** Cast to `CustomEvent`.

```typescript
// ✅ GOOD: Proper type casting
EventTarget.addEventListener('skin-loaded', (event) => {
  const { detail } = event as CustomEvent
  console.log(detail)
})
```

## Testing Strategy

Tests should be located in `event-target/__tests__/event-target.test.ts`.

### Test Categories

1. **Instance type:**
   - EventTarget is an instance of window.EventTarget

2. **Event operations:**
   - addEventListener registers handlers
   - removeEventListener unregisters handlers
   - dispatchEvent triggers registered handlers

3. **Multiple listeners:**
   - Multiple handlers can be registered for same event
   - All handlers are called when event dispatches

4. **Event data:**
   - CustomEvent detail is accessible in handlers

## Maintainer Notes

### Critical Invariants

1. **Singleton:** There must only be one `EventTarget` instance exported. Creating new instances breaks communication.

2. **No modification:** Don't add methods or properties to the exported instance. Keep it as a plain `EventTarget`.

### When to Modify

This module should rarely need changes. The only reasons to modify:

- Removing the module entirely (if global events are no longer needed)
- Adding TypeScript types for specific event names (optional enhancement)

### Performance Considerations

- **Listener overhead:** Each listener has minimal overhead. However, hundreds of listeners on the same event type could impact dispatch performance.
- **Memory:** Listeners hold references to their callbacks. Forgotten listeners prevent garbage collection of those callbacks and their closures.
