# Flesh Cage - Full System Verification

> **⚠️ Note:** This document is outdated and needs updating. Some references to removed packages (macros, vite) are still present. For current documentation, see [README.md](./README.md) and [GETTING_STARTED.md](./GETTING_STARTED.md).

**Date:** 2025-12-28
**Status:** Outdated
**Package Structure:** Single unified package `@everything-dies/flesh-cage`

## ✅ Complete Command Verification

### 1. Development Commands

#### Start Development Server

```bash
yarn dev
```

**Status:** ✅ Working  
**Output:** Vite dev server starts on http://localhost:3000  
**What it does:** Runs the playground with hot module reloading

---

### 2. Build Commands

#### Build All Packages

```bash
yarn build
```

**Status:** ✅ Working  
**Output:** Builds flesh-cage package + playground  
**Build Time:** ~5s

#### Build Packages Only

```bash
yarn build:packages
```

**Status:** ✅ Working  
**Output:**

- ESM + CJS bundles
- TypeScript declarations (.d.ts, .d.cts)
- Source maps
  **Bundle Sizes:**
- Main (macros): 11.49 KB (ESM), 11.75 KB (CJS)
- Core: 7.75 KB (ESM), 7.80 KB (CJS)
- Vite plugin: 292 B (ESM), 325 B (CJS)

---

### 3. Type Checking

```bash
yarn typecheck
```

**Status:** ✅ Working  
**What it checks:**

- Package source files
- Playground source files
- Type correctness across module boundaries

---

### 4. Linting & Formatting

#### Lint

```bash
yarn lint
```

**Status:** ✅ Working  
**Warnings:** 2 non-critical React fast-refresh warnings  
**Errors:** 0

#### Format Check

```bash
yarn format:check
```

**Status:** ✅ Working

#### Auto-format

```bash
yarn format
```

**Status:** ✅ Working

---

### 5. Testing

#### Run All Tests

```bash
yarn test
```

**Status:** ✅ Working  
**Test Results:**

- 3 test files
- 7 tests total
- All passing
  **Coverage:** Available with `yarn test:coverage`

---

### 6. Validation

```bash
yarn validate
```

**Status:** ✅ Working  
**Validates:**

1. **Package Quality** (publint): All good! ✅
2. **Type Exports** (attw): All resolutions working ✅
   - node16 CJS: ✅
   - node16 ESM: ✅
   - bundler: ✅
3. **Bundle Sizes** (size-limit): All within limits ✅
   - Main: 1.9 kB (limit: 10 kB)
   - Core: 1.2 kB (limit: 5 kB)
   - Vite: 78 B (limit: 2 kB)

---

### 7. Cleanup

```bash
yarn clean
```

**Status:** ✅ Working  
**Removes:** dist/, .turbo/, \*.tsbuildinfo files

---

## ✅ CI/CD Status

**GitHub Actions:** https://github.com/everything-dies/flesh-cage/actions

Latest Run: ✅ All passing

- Test & Lint (Node 18): ✅
- Test & Lint (Node 20): ✅
- E2E Tests: ✅

---

## ✅ Package Exports

The package provides three entry points:

### Main Export (Component Macros)

```typescript
import { Provider, createShadowComponent } from '@everything-dies/flesh-cage'
```

### Core Export (Advanced Usage)

```typescript
import { SheetsCache } from '@everything-dies/flesh-cage/core'
```

### Vite Plugin

```typescript
import { shadowComponents } from '@everything-dies/flesh-cage/vite'
```

---

## ✅ File Structure

```
flesh-cage/
├── packages/
│   └── flesh-cage/              # @everything-dies/flesh-cage
│       ├── src/
│       │   ├── core/            # Core runtime
│       │   ├── macros/          # React components (main)
│       │   └── vite/            # Vite plugin
│       ├── dist/                # Build output
│       │   ├── index.{js,cjs}
│       │   ├── core.{js,cjs}
│       │   ├── vite.{js,cjs}
│       │   └── *.d.{ts,cts}
│       └── package.json
├── examples/
│   └── playground/              # Development playground
└── .github/workflows/           # CI/CD
```

---

## ✅ Quick Start for New Contributors

```bash
# 1. Clone and install
git clone https://github.com/everything-dies/flesh-cage.git
cd flesh-cage
corepack enable
yarn install

# 2. Start development
yarn dev

# 3. Run tests
yarn test

# 4. Build
yarn build

# 5. Validate everything
yarn validate
```

---

## ✅ Common Development Workflows

### Adding a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Start dev server
yarn dev

# 3. Make changes to packages/flesh-cage/src/

# 4. Run tests
yarn test

# 5. Validate
yarn validate

# 6. Commit
git add .
git commit -m "feat: add my feature"
git push
```

### Running Specific Package Tests

```bash
cd packages/flesh-cage
yarn test
yarn test:watch
yarn test:coverage
```

### Building for Production

```bash
yarn build:packages
yarn validate
```

---

## ✅ Troubleshooting

### Issue: "yarn dev" not working

**Solution:** Make sure you're in the root directory

```bash
pwd  # Should show: /path/to/flesh-cage
yarn dev
```

### Issue: Type errors in playground

**Solution:** Rebuild the package

```bash
yarn build:packages
```

### Issue: Clean fails

**Solution:** Already fixed! Clean now handles missing files gracefully

```bash
yarn clean  # Works even with no build artifacts
```

---

## ✅ Final Checklist

- [x] Dev server starts and hot-reloads
- [x] Package builds successfully
- [x] All tests pass
- [x] Type checking passes
- [x] Linting passes
- [x] Formatting is correct
- [x] Package validation passes
- [x] CI/CD pipeline passes
- [x] Playground builds
- [x] Clean script works
- [x] Documentation is up to date

**Status: EVERYTHING IS FULLY FUNCTIONAL ✨**
