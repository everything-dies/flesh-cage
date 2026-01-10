# Changesets

This folder contains changeset files. Learn more about [changesets](https://github.com/changesets/changesets).

## Release Workflow

### 1. Create a Changeset

When making changes that should be included in a release:

```bash
yarn changeset
```

Follow the prompts to:

- Select which packages are affected (use spacebar to select)
- Choose the version bump type:
  - `patch` - bug fixes (0.0.x)
  - `minor` - new features (0.x.0)
  - `major` - breaking changes (x.0.0)
- Write a summary of your changes

This creates a markdown file in `.changeset/` describing your changes.

### 2. Commit and Push

Commit the changeset file along with your code changes:

```bash
git add .
git commit -m "feat: your feature description"
git push
```

### 3. Automated Release PR

When you push to `main`, GitHub Actions will:

1. Detect pending changesets
2. Create a "Version Packages" PR that:
   - Bumps package versions
   - Updates CHANGELOG.md
   - Removes the changeset files

### 4. Publish

When you merge the "Version Packages" PR:

- GitHub Actions automatically publishes to npm
- Packages are published with [provenance](https://docs.npmjs.com/generating-provenance-statements) attestation

## Manual Publishing

If you need to publish manually (not recommended):

```bash
yarn changeset version  # Apply version bumps
yarn build              # Build packages
yarn changeset publish  # Publish to npm
```

## Tips

- **Multiple changesets**: You can create multiple changesets for different changes before releasing
- **Empty changeset**: Use `yarn changeset --empty` if you want to trigger a release without changes
- **Prerelease**: See [changesets prerelease docs](https://github.com/changesets/changesets/blob/main/docs/prereleases.md) for alpha/beta releases
