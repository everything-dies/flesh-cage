# Changesets

This folder contains changeset files. Learn more about [changesets](https://github.com/changesets/changesets).

## Creating a Changeset

When making changes that should be included in a release:

```bash
yarn changeset
```

Follow the prompts to select packages and describe your changes.

## Publishing

Publishing is automated via GitHub Actions on push to `main`.

Manual publishing (if needed):

```bash
yarn changeset version
yarn build
yarn changeset publish
```
