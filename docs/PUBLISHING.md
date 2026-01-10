# Publishing Guide

This guide covers the complete workflow for publishing new versions of `@everything-dies/flesh-cage` to npm.

## Quick Reference

```bash
# 1. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 2. Create changeset
yarn changeset
# OR manually create .changeset/<descriptive-name>.md

# 3. Commit changeset
git add -f .changeset/*.md
git commit -m "chore: add changeset for feature"
git push

# 4. Review and merge auto-generated PR "Version Packages"

# 5. Done! Package auto-publishes to npm
```

## Detailed Workflow

### 1. Prerequisites

Ensure you have:

- ✅ npm account with access to `@everything-dies` scope
- ✅ GitHub repo configured with `NPM_TOKEN` secret (for CI)
- ✅ Trusted publishing configured on npm (optional but recommended)

### 2. Make Your Changes

Edit files in `packages/flesh-cage/src/` and commit normally:

```bash
git add packages/flesh-cage/src/
git commit -m "feat: add awesome feature"
```

### 3. Create a Changeset

#### Option A: Interactive (when TTY available)

```bash
yarn changeset
```

Follow the prompts:

- **Select packages**: Choose which packages changed (usually `@everything-dies/flesh-cage`)
- **Bump type**:
  - `major` (1.0.0 → 2.0.0) - Breaking changes
  - `minor` (1.0.0 → 1.1.0) - New features (backward compatible)
  - `patch` (1.0.0 → 1.0.1) - Bug fixes
- **Summary**: Describe the change (becomes changelog entry)

#### Option B: Manual (always works)

Create `.changeset/<descriptive-name>.md`:

```markdown
---
'@everything-dies/flesh-cage': minor
---

Brief summary of the change

**Detailed description:**

- Feature 1
- Feature 2
- Breaking change (if major)

**Usage:**
\`\`\`typescript
// Example code
\`\`\`
```

**Bump Type Guidelines:**

- **major**: Breaking API changes (v0.x.x → v1.0.0, v1.x.x → v2.0.0)
- **minor**: New features, backward compatible (v0.1.x → v0.2.0, v1.0.x → v1.1.0)
- **patch**: Bug fixes, no API changes (v0.1.0 → v0.1.1, v1.0.0 → v1.0.1)

### 4. Commit and Push Changeset

Changesets are ignored by `.gitignore` by default, so use `-f` to force add:

```bash
git add -f .changeset/*.md
git commit -m "chore: add changeset for <feature-name>"
git push
```

### 5. Wait for "Version Packages" PR

The Changesets GitHub Action bot will automatically:

1. Detect the new changeset on `main`
2. Create/update a PR titled **"chore: version packages"**
3. Update `package.json` versions
4. Generate/update `CHANGELOG.md`
5. Consume (delete) changeset files from `.changeset/`

This typically happens within 30 seconds of pushing.

Check for the PR:

```bash
gh pr list
```

### 6. Review the Version PR

Open the "Version Packages" PR and verify:

- ✅ Version bump is correct (major/minor/patch)
- ✅ `CHANGELOG.md` entries are accurate
- ✅ No unintended changes
- ✅ All CI checks pass (tests, lint, typecheck)

Example PR: https://github.com/everything-dies/flesh-cage/pulls

### 7. Merge to Publish

**Merge the PR** (squash, merge, or rebase - doesn't matter).

This triggers the Release workflow which:

1. ✅ Builds all packages (`yarn build:packages`)
2. ✅ Runs tests (`yarn test`)
3. ✅ Validates packages (`yarn validate`)
4. ✅ Publishes to npm with provenance (`yarn changeset publish`)
5. ✅ Creates git tags for versions

### 8. Verify Publication

Check npm to confirm:

```bash
npm view @everything-dies/flesh-cage

# Or visit
open https://www.npmjs.com/package/@everything-dies/flesh-cage
```

The new version should appear within 1-2 minutes.

## Advanced Scenarios

### Multiple Changesets (Multiple Features)

You can create multiple changesets before releasing:

```bash
# Feature 1
git commit -m "feat: add css tag"
yarn changeset  # Create changeset 1
git add -f .changeset/*.md && git commit -m "chore: changeset for css tag"

# Feature 2
git commit -m "feat: add theme switcher"
yarn changeset  # Create changeset 2
git add -f .changeset/*.md && git commit -m "chore: changeset for theme switcher"

# Push all at once
git push

# Bot creates ONE "Version Packages" PR combining both changes
```

The bot will:

- Combine all changesets
- Use the **highest** bump type (if one is `minor` and one is `patch`, result is `minor`)
- Merge all changelog entries

### Hotfix Release (Patch)

For urgent bug fixes:

```bash
# Fix the bug
git commit -m "fix: critical security issue"

# Create patch changeset
yarn changeset
# Select: patch

# Push immediately
git add -f .changeset/*.md
git commit -m "chore: changeset for security fix"
git push

# Merge PR ASAP
gh pr merge --auto --squash $(gh pr list --json number --jq '.[0].number')
```

### Pre-release Versions (Alpha/Beta)

For testing before stable release:

```bash
# Enter pre-release mode
yarn changeset pre enter alpha

# Make changes and create changesets normally
yarn changeset

# Versions will be: 0.2.0-alpha.0, 0.2.0-alpha.1, etc.

# Exit pre-release mode when ready for stable
yarn changeset pre exit
```

### Local Testing Before Publish

Test the build locally:

```bash
# Build packages
yarn build:packages

# Pack to see what will be published
cd packages/flesh-cage
yarn pack --dry-run

# Or create actual tarball
yarn pack
# Inspect: @everything-dies-flesh-cage-v0.1.0.tgz

# Test in another project
cd /path/to/test/project
yarn add /path/to/flesh-cage/packages/flesh-cage/@everything-dies-flesh-cage-v0.1.0.tgz
```

## Troubleshooting

### "Version Packages" PR Not Created

**Symptoms:** No PR appears after pushing changeset

**Solutions:**

1. Wait 60 seconds (bot might be delayed)
2. Check `.changeset/` directory has your `.md` file
3. Verify file format (frontmatter with `---`)
4. Check GitHub Actions permissions:
   - Settings → Actions → General → Workflow permissions
   - Enable "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"
5. Check workflow logs: https://github.com/everything-dies/flesh-cage/actions

### Publishing Fails with Auth Error

**Symptoms:** Release workflow fails with npm authentication error

**Solutions:**

1. Verify `NPM_TOKEN` secret exists:
   - Settings → Secrets and variables → Actions
   - Check `NPM_TOKEN` is set
2. Regenerate npm token:
   - Visit https://www.npmjs.com/settings/tokens
   - Generate "Automation" token
   - Update GitHub secret
3. Check token hasn't expired
4. Verify token has publish access to `@everything-dies` scope

### Package Not Found After Publish

**Symptoms:** `npm view @everything-dies/flesh-cage` shows old version

**Solutions:**

1. Wait 2-5 minutes (npm CDN propagation)
2. Check package.json has correct name: `@everything-dies/flesh-cage`
3. Check `publishConfig.access: "public"` in package.json
4. Verify you have publish rights to the scope:
   ```bash
   npm org ls everything-dies
   ```
5. Check workflow logs for actual publish command output

### Build Fails Before Publish

**Symptoms:** Release workflow fails at "Build packages" step

**Solutions:**

1. Run locally to reproduce:
   ```bash
   yarn build:packages
   ```
2. Fix TypeScript errors:
   ```bash
   yarn typecheck
   ```
3. Ensure all tests pass:
   ```bash
   yarn test
   ```
4. Check validation:
   ```bash
   yarn validate
   ```

### Changeset Ignored by Git

**Symptoms:** `git add .changeset/*.md` says "ignored by .gitignore"

**Solution:** Use force flag:

```bash
git add -f .changeset/*.md
```

The `.gitignore` has `.changeset/*.md` to prevent accidental commits, but changesets SHOULD be committed.

### Wrong Version Bump

**Symptoms:** PR shows wrong version (wanted minor, got patch)

**Solutions:**

1. Check changeset file frontmatter:
   ```markdown
   ---
   '@everything-dies/flesh-cage': minor # ← Check this
   ---
   ```
2. Close the PR (don't merge)
3. Fix the changeset file locally
4. Amend commit and force push:
   ```bash
   # Edit .changeset/<name>.md
   git add .changeset/<name>.md
   git commit --amend --no-edit
   git push --force-with-lease
   ```
5. Bot will update the PR automatically

## Emergency Rollback

If a bad version was published:

### Option 1: Deprecate (Recommended)

```bash
# Deprecate the bad version
npm deprecate @everything-dies/flesh-cage@0.2.0 "Critical bug, use 0.2.1+"

# Publish fix immediately
yarn changeset  # Create patch
git add -f .changeset/*.md
git commit -m "fix: rollback breaking change"
git push
# Merge PR when ready
```

### Option 2: Unpublish (Only within 72 hours)

```bash
# WARNING: Only works within 72 hours of publish
npm unpublish @everything-dies/flesh-cage@0.2.0

# Then publish correct version
```

**Note:** Unpublishing is discouraged by npm. Prefer deprecation + patch release.

## Best Practices

### Commit Message Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature (minor bump)
fix: bug fix (patch bump)
feat!: breaking change (major bump)
docs: documentation only (no bump)
chore: tooling changes (no bump)
test: test changes (no bump)
```

### Changeset Naming

Use descriptive names for changeset files:

```
.changeset/add-css-tag.md              ✅ Good
.changeset/feat-css.md                 ✅ Good
.changeset/orange-dogs-smile.md        ❌ Generated, unclear
```

### Release Frequency

- **Patches**: As needed (hotfixes, bug fixes)
- **Minors**: Every 1-2 weeks (new features)
- **Majors**: Quarterly or as needed (breaking changes)

### Testing Before Merge

Always ensure CI passes before merging "Version Packages" PR:

- ✅ Tests passing
- ✅ Lint clean
- ✅ TypeScript compiles
- ✅ E2E tests pass
- ✅ Package validation passes

## Automation Reference

### GitHub Workflows

**Release Workflow** (`.github/workflows/release.yml`):

- Triggered on: `push` to `main`
- Creates "Version Packages" PR when changesets exist
- Publishes to npm when versions change

**CI Workflow** (`.github/workflows/ci.yml`):

- Runs on all pushes and PRs
- Tests, lint, typecheck, build, validate

### npm Trusted Publishing (OIDC)

The repo uses npm's trusted publishing via GitHub OIDC:

- No long-lived `NPM_TOKEN` needed (more secure)
- Configured in package.json: `NPM_CONFIG_PROVENANCE: true`
- Publishes with provenance attestation
- Learn more: https://docs.npmjs.com/generating-provenance-statements

## Reference Links

- [Changesets Documentation](https://github.com/changesets/changesets)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [npm Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements)

## Need Help?

- 📖 Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- 💬 Open a [discussion](https://github.com/everything-dies/flesh-cage/discussions)
- 🐛 Report a [bug](https://github.com/everything-dies/flesh-cage/issues)
