# @everything-dies/flesh-cage

## 0.2.0

### Minor Changes

- 81a354b: Add `css` tagged template for zero-config Prettier auto-formatting

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

## 0.1.0

### Minor Changes

- Initial release of flesh-cage

  Modern CSS-in-TypeScript with Shadow DOM & Constructable Stylesheets
  - Core API: styled(), Provider, useContext(), useCore()
  - Shadow DOM + Constructable Stylesheets integration
  - Lazy-loaded skins with dynamic imports
  - Full TypeScript support
  - React 18+ and React 19+ compatible
