---
"@everything-dies/flesh-cage": minor
---

Add `css` tagged template for zero-config Prettier auto-formatting

Introduces a lightweight developer experience utility that enables automatic CSS formatting in skin definitions without requiring IDE extensions or Prettier plugins.

**Features:**
- Zero-config Prettier integration for CSS auto-formatting
- No-op pass-through implementation (alias for `String.raw`)
- Zero runtime cost (native function alias)
- Maintains template literal interpolation behavior

**Usage:**
```typescript
import { css } from '@everything-dies/flesh-cage'

const skin = css`
  [part='surface'] {
    display: flex;
    border-radius: 4px;
  }
`
```

The `css` tag acts as a semantic signal to Prettier, enabling automatic detection and formatting of CSS content within template literals. This provides a seamless "zero-config" indentation experience for skin definitions.
