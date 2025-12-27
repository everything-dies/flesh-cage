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
    "@flesh-cage/core": "workspace:*",
    "@flesh-cage/react": "workspace:*"
  }
}
```

This means:
- ✅ Changes to packages are immediately reflected
- ✅ Full TypeScript support with source maps
- ✅ No need to rebuild packages (Vite handles it)
- ✅ Real-world testing environment

## What's Included

- **Button Component**: Example using `createShadowComponent`
- **Three Skins**: Material, Brutalist, Glassmorphic
- **Provider Demo**: Shows `SkinProvider` and nesting
- **Interactive UI**: Switch skins and see live updates

## Testing Your Changes

1. Make changes to packages (e.g., `packages/react/src/context.tsx`)
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
│   │   └── Button/
│   │       ├── index.tsx          # Component using createShadowComponent
│   │       └── skins/
│   │           ├── material.ts    # Material skin
│   │           ├── brutalist.ts   # Brutalist skin
│   │           └── glassmorphic.ts # Glassmorphic skin
│   ├── App.tsx                    # Main app with SkinProvider
│   ├── App.css
│   ├── main.tsx                   # Entry point
│   └── index.css
├── index.html
├── vite.config.ts                 # Vite config with aliases
└── package.json                   # Workspace dependencies
```
