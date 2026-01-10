# Chapter 1: Project Overview - Flesh Cage

**Navigation**

- **Chapter 1: Project Overview**
- [Chapter 2: Theming vs. Skins](./02-skins-vs-themes.md)
- [Chapter 3: Lazy vs. Eager Loading](./03-lazy-vs-eager-loading.md)
- [Chapter 4: Runtime vs. Platform](./04-runtime-vs-platform.md)
- [Chapter 5: Design Systems](./05-design-systems.md)
- [Chapter 6: Specificity and Scope](./06-specificity-and-scope.md)
- [Chapter 7: The Semantic Contract](./07-semantic-contract.md)

---

**Table of Contents**

- [How It Works](#how-it-works)

"Flesh Cage" is a [CSS-in-JS](https://en.wikipedia.org/wiki/CSS-in-JS) library that enables a highly dynamic and performant styling paradigm for [React](https://react.dev/) applications. It uniquely leverages modern web platform features to deliver true [style encapsulation](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) and efficient, on-the-fly theme switching.

At its core, it revolves around three main technologies:

1.  **[Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) & [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)**: It wraps your React components in a Custom Element, using the Shadow DOM to provide complete, unbreachable style encapsulation. This means your component styles will never leak out, and global styles will never leak in.

2.  **[Constructable Stylesheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet)**: Instead of manipulating `<style>` tags or inline styles, it uses `[new CSSStyleSheet()](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet)` to parse styles. These stylesheets are then applied to a component's shadow root via `[adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets)`. This is an extremely efficient method, as a stylesheet is parsed only once and can be reused across many components.

3.  **Dynamic Imports for "Skins"**: The library uses the concept of "skins" for theming. A skin is simply a CSS file that is loaded as a module using [dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import). This allows for code-splitting your styles and loading them on demand.

### How It Works

1.  You create a styled component using the `styled()` higher-order component. This HOC registers a new **custom element** (e.g., `<my-button>`).
2.  You provide a set of `skins` to the `styled()` component, where each skin is a function that dynamically imports a CSS module (`() => import('./skin.css')`).
3.  The `Provider` component is used to set the current `skin` for a tree of components.
4.  When a styled component renders, it creates an instance of its custom element.
5.  A React hook (`useCore`) inside the styled component detects the current `skin` from the `Provider`.
6.  It then dispatches an event to the custom element, instructing it to load the new skin.
7.  The custom element logic fetches the stylesheet (if it hasn't already), creates a `CSSStyleSheet` object, and applies it to its Shadow DOM using `adoptedStyleSheets`.
8.  Finally, your original React component is rendered inside the Shadow DOM using a [React Portal](https://react.dev/reference/react-dom/createPortal).

This architecture leads to some powerful features:

- **Performant Theme Switching**: Changing the `skin` on the `Provider` triggers a nearly instantaneous visual change, as it only involves swapping a stylesheet reference, not re-rendering the entire DOM tree.
- **React Suspense Integration**: Skin loading is asynchronous. The library can integrate with [React Suspense](https://react.dev/reference/react/Suspense) to show fallback UIs while a new skin is being loaded.
- **Stale Load Aborting**: If you switch skins rapidly, it automatically aborts the previous, now-stale, skin-loading request.

In essence, it's a sophisticated approach to styling that prioritizes performance, encapsulation, and dynamic capabilities, built on a foundation of modern [web standards](https://developer.mozilla.org/en-US/docs/Web/Standards).
