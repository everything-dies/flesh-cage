# Playground

Local development environment for testing flesh-cage packages.

## Quick Start

From the repo root:

```bash
# Install dependencies
yarn install

# Start playground
yarn dev
```

This will:

1. Start Vite dev server on http://localhost:3000
2. Open your browser automatically
3. Hot reload on changes to packages or playground code

## How It Works

The playground uses **workspace protocol** to import packages locally:

```json
{
  "dependencies": {
    "@everything-dies/flesh-cage": "workspace:*"
  }
}
```

This means:

- ✅ Changes to the package are immediately reflected
- ✅ Full TypeScript support with source maps
- ✅ No need to rebuild the package (Vite handles it)
- ✅ Real-world testing environment

## What's Included

- **Button Component**: Example using `styled()` API
- **Counter Component**: Additional interactive example
- **Three Skins**: Material, Brutalist, Glassmorphic
- **Provider Demo**: Shows `Provider` and nesting
- **Interactive UI**: Switch skins and see live updates

## Testing Your Changes

1. Make changes to the package (e.g., `packages/flesh-cage/src/macros/context.tsx`)
2. Save the file
3. Vite hot reloads instantly
4. See changes in the browser

No build step needed during development!

## Adding More Examples

1. Create new component in `src/components/`
2. Create skin files in `skins/` folder
3. Import and use in `App.tsx`
4. Test immediately

## Structure

```
playground/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── index.tsx          # Component using styled() API
│   │   │   └── skins/
│   │   │       ├── material.ts    # Material skin
│   │   │       ├── brutalist.ts   # Brutalist skin
│   │   │       └── glassmorphic.ts # Glassmorphic skin
│   │   └── Counter/
│   │       └── index.tsx          # Counter component example
│   ├── App.tsx                    # Main app with Provider
│   ├── main.tsx                   # Entry point
│   └── vite.config.ts             # Vite config with aliases
├── index.html
└── package.json                   # Workspace dependencies
```
