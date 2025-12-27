# Contributing to Flesh Cage

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js >= 18
- Yarn >= 4.0 (installed via Corepack)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/fernandocamargo/flesh-cage.git
cd flesh-cage

# Enable Corepack (for Yarn 4)
corepack enable

# Install dependencies
yarn install

# Start playground
yarn dev

# Run tests
yarn test

# Build packages
yarn build
```

## Project Structure

```
flesh-cage/
├── packages/
│   ├── core/           # Core runtime
│   ├── react/          # React bindings
│   └── vite-plugin/    # Vite plugin
├── examples/
│   └── playground/     # Local development environment
├── .github/
│   └── workflows/      # CI/CD pipelines
└── .idea/
    └── design-docs/    # Design documentation
```

## Development Workflow

### 1. Make Changes

Edit files in `packages/*/src/`. The playground hot reloads automatically.

### 2. Add Tests

```bash
# Run tests for a specific package
cd packages/core
yarn test

# Run all tests
yarn test

# Coverage
yarn test:coverage
```

### 3. Lint & Format

```bash
# Lint
yarn lint
yarn lint:fix

# Format
yarn format
yarn format:check
```

### 4. Type Check

```bash
yarn typecheck
```

### 5. Create Changeset

```bash
yarn changeset
```

Follow prompts to describe your changes. This will be used for release notes.

### 6. Open Pull Request

- Push to a feature branch
- Open PR against `main`
- CI will run tests, linting, type checking
- Request review

## Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Flat config with strict rules
- **Prettier**: 2 spaces, single quotes, no semicolons
- **Naming**: camelCase for functions/variables, PascalCase for components/types

## Testing Guidelines

- **Unit tests**: Test individual functions/components
- **Integration tests**: Test package interactions
- **Coverage**: Aim for 80%+ coverage
- **E2E tests**: Playwright for browser testing

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
test: add tests
chore: tooling/config changes
```

## Publishing

Releases are automated via GitHub Actions. When PRs are merged to `main`:

1. Changesets creates a "Version Packages" PR
2. Merge that PR to trigger npm publish
3. Packages are published with provenance

## Need Help?

- 📖 Read the [design docs](./ideas/design-docs/)
- 💬 Open a [discussion](https://github.com/fernandocamargo/flesh-cage/discussions)
- 🐛 Report a [bug](https://github.com/fernandocamargo/flesh-cage/issues)

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to build something great together.
