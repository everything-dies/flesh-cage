# Everything Public Philosophy

## The Question

**Should every part of the library be public, even internal implementation details?**

The philosophy: Make all code accessible with clear disclaimers that internals are encouraged for use but likely to change. Ideally consumers wouldn't need them, but making them available is a bold move towards transparency and flexibility.

---

## Why This Is Compelling ✓

### 1. Escape Hatches

When you need to work around a limitation or bug, having access to internals prevents being completely blocked. Being stuck because a single internal function isn't exported is a frustrating experience that this philosophy eliminates.

**Example:** Need to manually create a stylesheet without going through the full `styled()` flow? With `Sheets` exported, you can.

### 2. Composition Over Prediction

You can't predict every use case. Giving access to primitives lets users compose solutions you never imagined - this is how great ecosystems emerge.

**Historical precedent:**

- React hooks started as internal patterns
- Unix pipes compose simple tools into complex workflows
- Solid.js primitives enable patterns the authors didn't anticipate

### 3. Trust Your Users

Treating users as adults who can read disclaimers aligns with a minimalist aesthetic. If they import `flesh-cage/core/sheets` despite warnings, that's their informed choice.

**Anti-pattern:** Libraries that name internals `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` (looking at you, React) instead of just being honest about stability.

### 4. Discovery & Learning

Public internals serve as documentation - users can explore to understand how things work rather than treating the library as a black box.

**Benefits:**

- Easier debugging (can inspect internal state)
- Better understanding of the library's design
- Learning resource for developers
- Encourages contributions (less mystery = less intimidation)

### 5. Gradual Stabilization

Starting public means you learn what people actually need. Patterns emerge from real usage rather than guesswork about what "should" be public.

**Process:**

1. Ship everything public with clear stability indicators
2. Observe what users actually import
3. Stabilize the patterns that emerge
4. Keep rarely-used APIs in unstable tier

---

## The Tradeoffs To Consider

### 1. Semver Becomes Harder

**Challenge:** Changing internal APIs becomes a breaking change if people depend on them.

**Questions to answer:**

- Do you ignore semver for unstable internals?
- Do you bump major versions frequently?
- How do you signal that something changed in an unstable API?

**Mitigation Strategy - Path-Based Stability:**

```typescript
// Stable - follows semver strictly, full support
import { styled } from '@everything-dies/flesh-cage'

// Advanced - stable but for power users
import { Sheets } from '@everything-dies/flesh-cage/core'

// Unstable - may change without warning
import { verify } from '@everything-dies/flesh-cage/unstable'
```

**Alternative - Naming Convention:**

```typescript
// Stable
export { styled, Provider, useContext }

// Unstable (underscore prefix)
export { _verify, _Sheets }
```

### 2. Support Burden

**Reality:** Users will file issues about breakage in "unstable" internals.

**Mitigation:**

- Clear documentation upfront in README
- Bot that auto-labels issues about unstable APIs
- Template that asks "Are you using unstable APIs?"
- Explicit note in manifesto about limited support for unstable APIs

**Response template:**

> This issue involves `[unstable-api]` which is marked as unstable. We may not fix this before the next breaking change to this API. Consider using the stable alternative `[stable-api]` or accept the risk of instability.

### 3. Design Freedom

**Tension:** Once something is public and used, even with disclaimers, there's social pressure not to change it. This can slow down refactoring.

**Counter-argument:** If your manifesto is clear and the naming convention signals stability, users self-select into the risk. Those who want stability stick to stable APIs; those who need internals accept the tradeoff.

**Real cost:** More communication overhead, more changelog detail, more consideration before changing things.

---

## Concrete Approach

### Three-Tier System

#### Tier 1: Stable

**Characteristics:**

- Full support
- Follows semver strictly
- Breaking changes only in major versions
- Comprehensive documentation
- Tested and maintained

**Examples:**

```typescript
export { styled, Provider, useContext } from '@everything-dies/flesh-cage'
```

#### Tier 2: Advanced/Internal (Stable but specialized)

**Characteristics:**

- Follows semver
- Documented but less comprehensive
- For power users and edge cases
- Tested but may have less polish

**Examples:**

```typescript
export { Sheets } from '@everything-dies/flesh-cage/core/sheets'
export { useCore } from '@everything-dies/flesh-cage/core/use-core'
```

#### Tier 3: Unstable/Experimental

**Characteristics:**

- No semver guarantees
- May change in minor versions
- Minimal documentation
- Use at your own risk

**Examples:**

```typescript
export { verify } from '@everything-dies/flesh-cage/unstable/verify'
// or with naming convention
export { _verify } from '@everything-dies/flesh-cage/core/styled'
```

### Simpler Alternative: Export Everything, Document Tiers

Just **export everything** from appropriate entrypoints and document stability in README:

```typescript
// packages/flesh-cage/src/core/index.ts
export type { ProviderProps, SkinLoader, Skins, StyledConfig } from './types'
export { styled } from './styled'
export { Provider } from './provider'
export { useContext } from './use-context'

// Advanced exports
export { useCore } from './use-core'
export { Sheets } from './sheets'
export { verify } from './styled'
```

**README structure:**

```markdown
## API Reference

### Core API (Stable)

- `styled()` - Create styled components
- `Provider` - Context provider for skin
- `useContext()` - Access current skin

### Advanced API (Stable, for power users)

- `useCore()` - Internal hook used by styled components
- `Sheets` - Cache and loader for stylesheets

### Internal Utilities (Unstable)

⚠️ **Warning:** These may change without major version bump

- `verify()` - AbortError handler
```

---

## Similar Philosophies in the Wild

### Rust

- Everything public by default
- `pub(crate)` requires explicit opt-in to privacy
- Clear module boundaries signal intent

### Svelte

- Exposes internal stores (`writable`, `readable`, `derived`)
- Users compose their own reactive primitives
- Led to rich ecosystem of custom stores

### Solid.js

- Exports primitives (`createSignal`, `createEffect`)
- "Official" APIs are compositions of primitives
- Enables patterns authors didn't anticipate

### React (Cautionary Tale)

- Initially private: `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`
- Scary naming instead of honest stability signals
- Eventually opened up more APIs (hooks, concurrent features)
- **Lesson:** Be explicit and honest rather than trying to scare users

### Vite

- Exports internal utilities under `/dist/`
- Clear documentation about what's stable
- Enables ecosystem plugins to build on internals

---

## Recommendation

Given the **minimalist, functional aesthetic** and **philosophy of transparency**, making everything public aligns perfectly.

### Requirements for Success

#### 1. Clear Documentation

```markdown
## Stability Guarantees

### 🟢 Stable

Follows semver. Breaking changes only in major versions.
Comprehensive docs and full support.

### 🟡 Advanced

Follows semver. For power users. Less documentation.
Support on a best-effort basis.

### 🔴 Unstable

No semver guarantees. May change in minor versions.
Use at your own risk. Minimal documentation.
```

#### 2. Predictable Naming

Choose one:

- **Path-based:** `/unstable/` for unstable exports
- **Prefix-based:** `_verify` for unstable exports
- **Export-based:** Separate export blocks with comments

#### 3. Explicit Manifesto

Set clear expectations:

```markdown
## Our Philosophy

We believe in radical transparency. All code is accessible.

**Why?**

- You need escape hatches
- We can't predict every use case
- You're smart enough to read warnings
- Internal code is documentation

**The Deal:**

- Stable APIs have strong semver guarantees
- Advanced APIs follow semver but expect you to read docs
- Unstable APIs may change anytime

**We trust you to:**

- Read stability markers
- Accept risk when using unstable APIs
- File issues knowing we may say "this is unstable, won't fix"
```

#### 4. Trust That Your Users Can Read

Don't use scary names. Don't hide things. Just be honest about stability and let users make informed decisions.

---

## What This Means for flesh-cage

### Current Public API (Stable)

```typescript
export { styled, Provider, useContext }
```

### Should Also Export (Advanced/Stable)

```typescript
export { useCore } // Already exported but unused - keep it
export { Sheets } // Currently internal - make it public
export { verify } // Currently internal - decide stability
```

### Decision Points

1. **Do you want a three-tier system or two-tier?**
   - Two-tier: Stable vs Unstable
   - Three-tier: Stable vs Advanced vs Unstable

2. **How do you signal instability?**
   - Path: `/unstable/`
   - Naming: `_functionName`
   - Documentation only

3. **What's your semver policy for unstable APIs?**
   - Change freely (not recommended - surprises users)
   - Document in CHANGELOG but don't bump major
   - Bump minor version and document clearly

### Recommended Starting Point

**Be simple:** Export everything from main entrypoint, document stability in README:

```typescript
// packages/flesh-cage/src/core/index.ts
export type { ProviderProps, SkinLoader, Skins, StyledConfig } from './types'

// Stable API
export { styled } from './styled'
export { Provider } from './provider'
export { useContext } from './use-context'

// Advanced API (stable but for power users)
export { useCore } from './use-core'
export { Sheets } from './sheets'

// Internal utilities (unstable - may change without major bump)
export { verify } from './styled'
```

---

## Questions to Consider for the Manifesto

1. **What do you call non-stable exports?**
   - "Advanced"? "Internal"? "Unstable"? "Experimental"?

2. **How many tiers do you want?**
   - Two (Stable/Unstable)?
   - Three (Stable/Advanced/Unstable)?

3. **What's your semver promise for each tier?**
   - Stable: Strict semver
   - Advanced: Semver but caveat emptor
   - Unstable: No guarantees

4. **How do you want to signal stability?**
   - Import paths
   - Naming conventions
   - Documentation only

5. **What's your support policy?**
   - Will you fix bugs in unstable APIs?
   - Will you accept PRs for unstable APIs?
   - How do you handle issues filed against unstable APIs?

6. **How does this affect your versioning strategy?**
   - More frequent major versions?
   - Minor versions for unstable API changes?
   - Separate versioning for stable vs unstable?

---

## Next Steps

1. Draft the manifesto with clear answers to the questions above
2. Decide on the tier system and stability signals
3. Update `packages/flesh-cage/src/core/index.ts` with new exports
4. Document stability tiers in README
5. Add stability badges/markers to API docs
6. Create issue templates that ask about unstable API usage
7. Add CHANGELOG convention for documenting unstable API changes

---

## Bottom Line

**This philosophy is valid and exciting.** The key to making it work is:

- **Honesty** over scary naming
- **Clear signals** about stability
- **Explicit expectations** in documentation
- **Trust** that users can make informed decisions

The minimalist aesthetic of flesh-cage - ternaries, functional style, clean implementations - already signals that this is a library for developers who appreciate transparency over hand-holding.

Making internals public is the API design equivalent of that aesthetic.
