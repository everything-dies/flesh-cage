# CSS Tag Helper

This directory contains the `css` tagged template literal helper.

## Purpose

The `css` tag is a lightweight helper designed to improve the developer experience when writing skin definitions for Flesh Cage components. It serves two primary functions:

1.  **Developer Experience:** It acts as a "hint" to editor tooling and formatters.
2.  **Automatic Formatting:** It enables [Prettier](https://prettier.io/) to automatically detect and format the contents of the template literal as CSS, providing a seamless, "zero-config" indentation experience.

## Implementation

The `css` tag is a simple, no-op "pass-through" tag. It is an alias for the native `String.raw` function.

```typescript
export const css = String.raw
```

It does not perform any transformations on the template literal at runtime. Its sole purpose is to provide a stable, recognizable hook for development tools.

## Usage

By wrapping your style definitions in the `css` tag, you get the benefit of automatic code formatting without needing to install any additional plugins or extensions (assuming a standard Prettier setup).

```typescript
import { css } from '@everything-dies/flesh-cage'

const buttonStyles = css`
  [part='surface'] {
    border-radius: 4px;
    display: flex; /* This will be correctly indented by Prettier */
  }
`
```
