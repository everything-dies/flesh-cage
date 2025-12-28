# Contributing to Flesh Cage

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js >= 18
- Yarn >= 4.0 (installed via Corepack)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/everything-dies/flesh-cage.git
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

### Prerequisites

Before you can publish packages to npm, ensure the following are configured:

#### 1. npm Organization/Scope

The `@flesh-cage` scope must exist on npm:

```bash
# Check if you have access to the scope
npm org ls flesh-cage

# If the scope doesn't exist, either:
# - Create it at https://www.npmjs.com/org/create
# - Or change package names to a scope you own
```

#### 2. NPM_TOKEN Secret

Add your npm automation token to GitHub:

1. Generate token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
   - Click "Generate New Token" → "Automation"
   - Copy the token
2. Add to GitHub at [Repository Settings → Secrets](https://github.com/everything-dies/flesh-cage/settings/secrets/actions)
   - Name: `NPM_TOKEN`
   - Value: Your token
3. Save

#### 3. Build Packages

Ensure all packages build successfully:

```bash
yarn build:packages
```

### Creating a Release

#### Step 1: Make Your Changes

Edit files in `packages/*/src/` and commit to `main` or a feature branch.

#### Step 2: Create a Changeset

Describe your changes for the changelog:

```bash
yarn changeset
```

Follow the prompts:

- **Select packages**: Choose which packages changed
- **Bump type**:
  - `major` (1.0.0 → 2.0.0) - Breaking changes
  - `minor` (1.0.0 → 1.1.0) - New features
  - `patch` (1.0.0 → 1.0.1) - Bug fixes
- **Summary**: Describe the change (used in changelog)

This creates a file in `.changeset/` - commit it:

```bash
git add .changeset
git commit -m "chore: add changeset for feature X"
git push
```

#### Step 3: Merge to Main

- If working on a branch, open a PR and merge to `main`
- CI will run tests, linting, type checking

#### Step 4: Version Packages PR

The Changesets bot will automatically:

1. Create a PR titled **"Version Packages"**
2. Update package versions in `package.json`
3. Generate/update `CHANGELOG.md` files
4. Consume changesets from `.changeset/`

**Review the PR** to ensure versions and changelogs look correct.

#### Step 5: Publish to npm

Merge the "Version Packages" PR. This triggers:

1. CI builds all packages
2. Runs tests and validation
3. Publishes to npm with provenance
4. Creates git tags for versions

Check [npm](https://www.npmjs.com/org/flesh-cage) to verify packages are published.

### Testing Before Publish

#### Local Dry Run

Test what would be published without actually publishing:

```bash
# Build packages
yarn build:packages

# Dry run for each package
yarn --cwd packages/core pack --dry-run
yarn --cwd packages/react pack --dry-run
yarn --cwd packages/vite-plugin pack --dry-run
```

#### Validate Package Quality

Run validation checks:

```bash
yarn validate
```

This runs:
- `publint` - Checks package.json correctness
- `@arethetypeswrong/cli` - Validates TypeScript types
- `size-limit` - Ensures bundle sizes are within limits

### Troubleshooting

**"Version Packages" PR not created**
- Check that changesets exist in `.changeset/`
- Verify GitHub Actions have required permissions
- Check workflow logs in Actions tab

**Publishing fails with authentication error**
- Verify `NPM_TOKEN` secret is set correctly
- Ensure token has "Automation" permission
- Check token hasn't expired

**Package not found after publish**
- Verify you have access to `@flesh-cage` scope
- Check npm for the package: `npm view @flesh-cage/core`
- Ensure `publishConfig.access: "public"` in package.json

**Build fails before publish**
- Run `yarn build:packages` locally
- Fix any TypeScript or build errors
- Ensure all tests pass: `yarn test`

### Release Workflow Summary

```
1. Developer makes changes
   ↓
2. yarn changeset (describe changes)
   ↓
3. Commit and push to main
   ↓
4. Bot creates "Version Packages" PR
   ↓
5. Review and merge PR
   ↓
6. Packages auto-publish to npm
   ✓ Published with provenance
   ✓ Git tags created
   ✓ Changelogs updated
```

## Need Help?

- 📖 Read the [design docs](./ideas/design-docs/)
- 💬 Open a [discussion](https://github.com/everything-dies/flesh-cage/discussions)
- 🐛 Report a [bug](https://github.com/everything-dies/flesh-cage/issues)

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to build something great together.
