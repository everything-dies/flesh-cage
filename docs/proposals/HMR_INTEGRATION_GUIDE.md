# HMR Integration Guide for Flesh Cage

## Current Architecture Summary

Your CSS-in-JS library uses a unique architecture:

- **Custom Elements** with Shadow DOM for style encapsulation
- **Lazy-loaded skins** via dynamic imports (`() => import('./skins/material')`)
- **Constructable Stylesheets** (`new CSSStyleSheet().replace(css)`)
- **Adopted StyleSheets** API (`shadowRoot.adoptedStyleSheets = [sheet]`)
- **Cached sheets** in a Map-based `Sheets` class

### Critical Challenge

When a skin file changes (e.g., `material.ts`), the current implementation:

1. ✅ Vite will detect the change and reload the module
2. ❌ The `Sheets` Map still holds the old `CSSStyleSheet` object
3. ❌ Active custom elements still reference the old cached sheet
4. ❌ New components get the old sheet from cache until page refresh

## HMR Strategy Options

### Option 1: Cache Invalidation with Sheet Replacement (Recommended)

**Pros:**

- Preserves all React state
- No component remounting
- Works with existing Suspense boundaries
- Minimal user disruption

**Cons:**

- Requires custom Vite plugin or HMR API integration
- Need to track active custom elements

**Implementation approach:**

```typescript
// In Vite plugin or skin loader
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // 1. Get new CSS from updated module
    const newCSS = newModule.default

    // 2. Create new CSSStyleSheet
    const newSheet = new CSSStyleSheet()
    await newSheet.replace(newCSS)

    // 3. Invalidate cache entry in Sheets Map
    sheetsInstance.invalidate(skinName)

    // 4. Update all active custom elements
    document.querySelectorAll('styled-button[skin="material"]').forEach((el) => {
      el.shadowRoot.adoptedStyleSheets = [newSheet]
    })
  })
}
```

### Option 2: Full Component Refresh

**Pros:**

- Simpler implementation
- Guaranteed fresh state
- Works with React Fast Refresh

**Cons:**

- Loses React component state
- Triggers Suspense boundaries
- More disruptive to dev experience

**Implementation approach:**

- Mark skin imports as non-cacheable during dev
- Let React Fast Refresh handle component updates
- Accept losing state on style changes

### Option 3: Hybrid Approach with Import Map Invalidation

**Pros:**

- Leverages Vite's module graph
- Clean separation of concerns
- Can preserve state for simple changes

**Cons:**

- Complex to implement
- May still lose state in edge cases

## Key Technical Considerations

### 1. Cache Invalidation Strategy

**Problem:** `Sheets` Map caches `CSSStyleSheet` objects indefinitely

**Solutions:**

- Add `Sheets.invalidate(skinName)` method to clear cache entries
- Add `Sheets.replace(skinName, newSheet)` to update cache atomically
- Use WeakMap for tracking which custom elements use which sheets
- Consider LRU eviction for memory management

### 2. Custom Element State Preservation

**Current state that needs preservation:**

- `shadowRoot.adoptedStyleSheets` array
- Event listeners (already handled by connectedCallback/disconnectedCallback)
- `skin` attribute value

**Approaches:**

- Keep custom element instance alive, only swap stylesheets
- Use MutationObserver to track skin attribute changes
- Maintain a registry of active custom elements per skin

### 3. React State Preservation

**Good news:** React state lives outside the custom element, so:

- Component props/state will survive if you don't remount
- Suspense boundaries should not re-trigger if you update sheets in-place
- Portal content (children) remains stable

**Watch out for:**

- If you invalidate the entire styled component, React will remount
- Suspense `use()` hook might re-trigger if promise changes

### 4. Vite Plugin Architecture

You'll likely need a Vite plugin to:

```typescript
// packages/vite-plugin/src/hmr.ts
export function fleshCageHMR() {
  return {
    name: 'flesh-cage-hmr',

    // Inject HMR runtime into skin files
    transform(code, id) {
      if (id.endsWith('.ts') && code.includes('export default `')) {
        return {
          code:
            code +
            `\n\nif (import.meta.hot) {
            import.meta.hot.accept((newMod) => {
              const event = new CustomEvent('flesh-cage:skin-update', {
                detail: {
                  skinPath: '${id}',
                  css: newMod.default
                }
              })
              window.dispatchEvent(event)
            })
          }`,
          map: null,
        }
      }
    },

    // Handle invalidation
    handleHotUpdate({ file, server, modules }) {
      if (isSkinFile(file)) {
        // Invalidate module graph
        // Notify client
      }
    },
  }
}
```

### 5. Runtime HMR Handler

Add a global handler in your library initialization:

```typescript
// packages/flesh-cage/src/core/hmr.ts
if (import.meta.hot) {
  window.addEventListener('flesh-cage:skin-update', async (event) => {
    const { skinPath, css } = event.detail
    const skinName = parseSkinNameFromPath(skinPath)

    // Create new sheet
    const newSheet = new CSSStyleSheet()
    await newSheet.replace(css)

    // Find all custom elements using this skin
    // This is the tricky part - need a registry
    customElementRegistry.forEach((element, tagName) => {
      const instances = document.querySelectorAll(tagName)
      instances.forEach((instance) => {
        if (instance.getAttribute('skin') === skinName) {
          instance.shadowRoot.adoptedStyleSheets = [newSheet]
        }
      })
    })
  })
}
```

### 6. Custom Element Registry

**Problem:** You need to track which custom elements are using which skins

**Solution:** Add a static registry to your styled() function:

```typescript
// Option A: WeakMap of element instances
const elementRegistry = new WeakMap<HTMLElement, string>() // element -> skinName

// Option B: Map of skin names to element sets
const skinRegistry = new Map<string, Set<WeakRef<HTMLElement>>>()

// Update in CustomElement.attributeChangedCallback:
skinRegistry.get(skin)?.add(new WeakRef(this))
```

### 7. Import Path Tracking

**Problem:** Mapping file paths to skin names

**Solutions:**

- During build, create a manifest: `{ './skins/material.ts': 'material' }`
- Parse the import path at runtime
- Use Vite's module graph API

### 8. Potential Race Conditions

**Watch out for:**

- Sheet replacement during active skin transitions
- Multiple rapid HMR updates
- Concurrent skin loads and invalidations

**Mitigations:**

- Use microtask queue for updates
- Debounce HMR events
- Lock during sheet replacement
- Use promise chains in Sheets.load()

## Recommended Implementation Path

### Phase 1: Foundation

1. Add `Sheets.invalidate(skin)` and `Sheets.replace(skin, sheet)` methods
2. Create a custom element registry system
3. Add dev-mode detection (`import.meta.env.DEV`)

### Phase 2: Basic HMR

1. Create Vite plugin skeleton
2. Inject HMR accept handlers into skin files
3. Implement cache invalidation on changes
4. Test with single component/skin

### Phase 3: Full Integration

1. Add global event bus for skin updates
2. Implement bulk sheet replacement
3. Handle concurrent updates
4. Add error boundaries and fallbacks

### Phase 4: Polish

1. Add console warnings for HMR events (dev only)
2. Performance metrics (time to update sheets)
3. Developer tools integration
4. Comprehensive error handling

## Testing Strategy

### Unit Tests

- `Sheets.invalidate()` clears correct entry
- `Sheets.replace()` updates cache atomically
- Registry tracks elements correctly

### Integration Tests

- Skin change updates visible styles
- React state preserved after update
- Suspense boundaries don't re-trigger
- Multiple skins update independently

### E2E Tests

- Full HMR flow in Vite dev server
- Rapid successive changes
- Switching skins during HMR
- Error recovery

## Alternative: Simplified Approach for MVP

If full HMR is too complex initially, consider:

1. **Dev-only cache bypass:**

   ```typescript
   load(skin: Names): Promise<CSSStyleSheet> {
     if (import.meta.env.DEV) {
       // Always load fresh in dev
       return this.#loadFresh(skin)
     }
     return super.get(skin) || this.#loadFresh(skin)
   }
   ```

2. **Accept state loss:**
   - Use Vite's default HMR
   - Components remount on skin changes
   - Simpler but worse DX

3. **Manual refresh indicator:**
   - Detect stale sheets
   - Show toast: "Styles updated - refresh to see changes"
   - Better than silent staleness

## Edge Cases to Handle

1. **Nested Providers with different skins:** If parent changes, don't invalidate children
2. **Preloaded skins:** Invalidate preload cache too
3. **Concurrent skin loading:** Lock or queue updates
4. **Error in new skin:** Rollback to previous sheet
5. **Custom element defined multiple times:** De-duplicate in registry
6. **Memory leaks:** Use WeakRef/WeakMap for element tracking
7. **SSR/SSG builds:** Disable HMR code in production

## Performance Considerations

- **Registry lookup:** O(1) with Map, O(n) with querySelectorAll
- **Sheet replacement:** Fast (native API), but measure with many elements
- **Event propagation:** Consider throttling global events
- **Memory:** WeakRef for automatic cleanup of dead elements
- **Bundle size:** Tree-shake HMR code in production

## Compatibility Notes

- **adoptedStyleSheets:** Chrome 73+, Firefox 101+, Safari 16.4+
- **CSSStyleSheet.replace():** Same as above
- **import.meta.hot:** Vite-specific, no issue
- **WeakRef:** Chrome 84+, Firefox 79+, Safari 14.1+

## Security Considerations

- HMR only in development mode
- Validate skin names to prevent injection
- Sanitize CSS if accepting from external sources (not applicable here)
- No eval() or Function() constructor

## Resources & References

- [Constructable Stylesheets Spec](https://wicg.github.io/construct-stylesheets/)
- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [Custom Elements Lifecycle](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [WeakRef for Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)

## Decision Matrix

| Approach                               | State Preservation | Complexity | DX Quality | Recommended? |
| -------------------------------------- | ------------------ | ---------- | ---------- | ------------ |
| Cache Invalidation + Sheet Replacement | ✅ Full            | High       | Excellent  | **Yes**      |
| Full Component Refresh                 | ❌ Lost            | Low        | Good       | For MVP      |
| Hybrid with Import Map                 | ⚠️ Partial         | Very High  | Excellent  | Future       |
| Manual Refresh Prompt                  | ✅ Full            | Very Low   | Poor       | Last Resort  |

## Next Steps

1. **Decide on approach** based on your priorities (DX vs implementation time)
2. **Prototype** the Sheets invalidation API
3. **Create minimal Vite plugin** that logs HMR events
4. **Test with one component** before generalizing
5. **Measure performance** with many active elements
6. **Document for users** how HMR behaves in their apps
