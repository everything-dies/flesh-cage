# Getting Started with Flesh Cage Development

## Initial Setup

```bash
# Enable Corepack for Yarn 4
corepack enable

# Install dependencies
yarn install

# Start playground for local development
yarn dev
```

The playground will open at http://localhost:3000 with hot reload enabled.

## Repository Structure

```
flesh-cage/
├── packages/
│   ├── core/                  # @flesh-cage/core
│   │   ├── src/
│   │   │   ├── sheets-cache.ts      # Ref-counted stylesheet cache
│   │   │   ├── custom-element.ts    # Custom element utilities
│   │   │   └── types.ts
│   │   ├── tsup.config.ts           # Library build config
│   │   └── package.json
│   │
│   ├── react/                 # @flesh-cage/react
│   │   ├── src/
│   │   │   ├── context.tsx                  # SkinProvider + useSkinContext
│   │   │   ├── create-shadow-component.tsx  # Factory API
│   │   │   ├── with-shadow-styles.tsx       # HOC API
│   │   │   ├── use-shadow-styles.ts         # Hook API
│   │   │   ├── shadow-root.tsx              # Component API
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   └── vite-plugin/           # @flesh-cage/vite-plugin
│       ├── src/
│       │   ├── index.ts       # Plugin implementation (placeholder)
│       │   └── types.ts
│       └── package.json
│
├── examples/
│   └── playground/            # Local development app
│       ├── src/
│       │   ├── components/
│       │   │   └── Button/    # Example component with 3 skins
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── vite.config.ts     # Aliases to packages/*/src
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # Tests, lint, type check, build
│       └── release.yml        # Automated publishing via changesets
│
└── .idea/
    └── design-docs/           # All design documentation
```

## Development Workflow

### 1. Make Changes to Packages

Edit files in `packages/*/src/`. Changes hot reload instantly in the playground.

```bash
# Edit a file
vim packages/react/src/context.tsx

# Save - Vite automatically reloads
# No build step needed!
```

### 2. Test Your Changes

**Unit Tests (Per Package):**

```bash
cd packages/core
yarn test              # Run once
yarn test:watch        # Watch mode
yarn test:coverage     # With coverage
```

**All Tests (Root):**

```bash
yarn test              # Run all package tests
yarn test:coverage     # With coverage report
```

**E2E Tests (Playwright):**

```bash
yarn test:e2e          # Run E2E tests
yarn test:e2e:ui       # Open Playwright UI
```

### 3. Build Packages

```bash
# Build all packages
yarn build

# Build only packages (not playground)
yarn build:packages

# Watch mode (rebuilds on change)
yarn build:watch
```

### 4. Validate Package Quality

```bash
# Run all validators
yarn validate

# Individual validators
yarn validate:package  # publint (npm package quality)
yarn validate:types    # attw (TypeScript types correctness)
yarn validate:size     # size-limit (bundle size checks)
```

### 5. Lint & Format

```bash
yarn lint              # Check for issues
yarn lint:fix          # Auto-fix issues

yarn format            # Format all files
yarn format:check      # Check formatting
```

### 6. Type Check

```bash
yarn typecheck         # Check all packages
```

## Creating a Release

### 1. Create a Changeset

```bash
yarn changeset
```

Follow the prompts:

1. Select changed packages (space to select, enter to continue)
2. Choose version bump type (patch/minor/major)
3. Describe your changes (used in changelog)

This creates a markdown file in `.changeset/` describing the change.

### 2. Commit and Push

```bash
git add .
git commit -m "feat: add new feature"
git push
```

### 3. Automated Release

When your PR merges to `main`:

1. GitHub Actions runs CI (tests, lint, build)
2. Changesets bot creates a "Version Packages" PR
3. Merge that PR to publish to npm automatically

## Playground Examples

The playground demonstrates:

- **SkinProvider** with dynamic skin switching
- **Nested providers** (different skins per section)
- **Three skins**: Material, Brutalist, Glassmorphic
- **Hot reload** when you edit skins or components

### Adding More Examples

1. Create new component:

```bash
mkdir -p examples/playground/src/components/Card
touch examples/playground/src/components/Card/index.tsx
mkdir examples/playground/src/components/Card/skins
```

2. Implement using any API flavor:

```tsx
// index.tsx
import { createShadowComponent } from '@flesh-cage/react'

export const Card = createShadowComponent({
  name: 'card',
  skins: {
    material: () => import('./skins/material'),
  },
  render: ({ children }) => <article part="surface">{children}</article>,
})
```

3. Create skin:

```ts
// skins/material.ts
export default `
  [part="surface"] {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`
```

4. Use in App.tsx:

```tsx
import { Card } from './components/Card'
;<SkinProvider skin="material">
  <Card>Hello World!</Card>
</SkinProvider>
```

## Testing Strategies

### Unit Tests

- Test individual functions (SheetsCache, custom element creation)
- Test React hooks (useSkinContext, useShadowStyles)
- Test component rendering

### Integration Tests

- Test Provider + Component interaction
- Test skin loading and caching
- Test nested providers

### E2E Tests

- Test in real browser (Playwright)
- Test Shadow DOM rendering
- Test Constructable Stylesheets
- Test skin switching

## Common Tasks

### Add New Package

```bash
mkdir -p packages/new-package/src
cp packages/core/package.json packages/new-package/
# Edit package.json, add to turbo.json
```

### Add Dependency to Package

```bash
cd packages/react
yarn add @some/package
```

### Add Dev Dependency to Root

```bash
yarn add -D -W some-dev-tool
```

### Debug Tests

```bash
# Add debugger statement in test
cd packages/core
yarn test:watch

# Or use VS Code debugger with breakpoints
```

### Check Bundle Size

```bash
cd packages/core
yarn validate:size

# To see what's in the bundle
yarn build
ls -lh dist/
```

## Troubleshooting

### "Module not found" in Playground

Check `vite.config.ts` aliases point to `packages/*/src` correctly.

### TypeScript Errors in IDE

```bash
# Rebuild all packages
yarn build:packages

# Restart TypeScript server in IDE
```

### Tests Failing

```bash
# Clean and reinstall
yarn clean
rm -rf node_modules
yarn install
```

### Hot Reload Not Working

```bash
# Restart dev server
# Kill (Ctrl+C) and run again
yarn dev
```

## Next Steps

1. ✅ Repository is fully set up
2. 📝 Read design docs in `.idea/design-docs/`
3. 🎨 Explore playground examples
4. 🧪 Write tests for your changes
5. 📦 Create changesets for releases
6. 🚀 Ship to npm!

Happy coding! 🎉
