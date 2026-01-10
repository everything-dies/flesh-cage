# Chapter 5: Building Bulletproof Design Systems - Encapsulation and Ergonomics

**Table of Contents**

- [The Shadow DOM: A Fortress for Your Components](#the-shadow-dom-a-fortress-for-your-components)
- [::part(): The Ergonomic Escape Hatch](#part-the-ergonomic-escape-hatch)
- [Composition and Deep Styling: The Holy Grail](#composition-and-deep-styling-the-holy-grail)

A successful design system provides components that are predictable, robust, themeable, and easy to compose. While many tools achieve some of these goals, they often do so at the cost of true encapsulation (by relying on conventions like [BEM](https://getbem.com/)) or by introducing proprietary, non-standard APIs that add to the learning curve.

Flesh Cage's philosophy is different: build with the grain of the web platform to achieve these goals natively.

## The Shadow DOM: A Fortress for Your Components

The single greatest threat to a design system's integrity is the global CSS namespace. A simple, seemingly harmless global style from a legacy stylesheet or a third-party library can have cascading, unpredictable effects that break your carefully crafted components.

```css
/* Some forgotten stylesheet from another era... */
button {
  padding: 0;
  border-radius: 0;
  font-family: 'Comic Sans MS'; /* Catastrophic failure */
}
```

Flesh Cage solves this by building a fortress around every component. Each `styled()` component is a true [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) with its own **[Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)**. This creates a hard boundary:

- **Styles Don't Get In:** That global `button` style will have zero effect on your `<styled-button>` component's internal button element.
- **Styles Don't Leak Out:** The intricate styles you write for your component's internals will never accidentally affect other elements on the page.

This provides the ultimate predictability. You can ship a component from your design system with 100% confidence that it will render and behave identically in every environment, shielded from outside interference.

## `::part()`: The Ergonomic Escape Hatch

A fortress is great for defense, but what if a consumer of your component _needs_ to make a targeted change? For example, tweaking the font size of a button's label in one specific context.

This is where the native CSS `[::part](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)` pseudo-element comes in. It's the W3C-specified, browser-native solution for this exact problem.

As a component author, you can explicitly expose certain internal elements as stylable "parts":

```tsx
// In your component definition
const ButtonBase = ({ children }) => (
  <button part="surface">
    <span part="label">{children}</span>
  </button>
)

// In your styled() config, you list which parts are public
export const Button = styled(ButtonBase, {
  name: 'styled-button',
  skins: {
    /* ... */
  },
  exportparts: 'label, surface', // The public API
})
```

A consumer can now style these specific parts from outside the component's shadow boundary using standard CSS syntax:

```css
/* A consumer can target a specific part of a specific component */
styled-button::part(label) {
  font-weight: bold;
}
```

The ergonomics here are key. `::part` is **not a framework-specific DSL**. It is a web standard. There is nothing new to learn beyond modern CSS. It's future-proof, and it creates a clear, intentional API contract between the component and its consumers.

## Composition and Deep Styling: The Holy Grail

This is where the architecture truly shines for creating sophisticated, themeable design systems. Because "skins" are just CSS files, they can contain any valid selectors—including those that describe relationships between styled components.

Imagine you have a `<styled-button>` that, when active, should alter the appearance of a `<styled-counter>` nested within it. With Flesh Cage, you don't need to pass state down through props (`isParentActive={true}`). You can express this relationship declaratively, right in the skin.

Let's say your button's JSX looks like this:

```tsx
const ButtonWithCounter = () => (
  <styled-button>
    Submit
    <styled-counter />
  </styled-button>
)
```

The `material` skin for `<styled-button>` can now define a rule that applies _only when it contains a counter_:

```css
/* Inside material.skin.css, which is applied to styled-button */

/* When this button has a styled-counter inside it... */
[:host(:has(styled-counter))](https://developer.mozilla.org/en-US/docs/Web/CSS/:host) [part='surface']
{
  /* ...make the surface padding bigger. */
  padding: 8px 16px;
}

/* And when THIS button is active... */
[:host([aria-pressed='true'])](https://developer.mozilla.org/en-US/docs/Web/CSS/:host)
{
  /* ...reach into the nested counter and style ITS 'number' part! */
  styled-counter::part(number) {
    color: var(--color-accent);
    transform: scale(1.1);
  }
}
```

This is incredibly powerful. You are creating **context-aware styling rules** that are co-located with the parent component's skin (using features like the `[:has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)` pseudo-class). The `<styled-counter>` doesn't need to know anything about its parent; its appearance is being themed from the outside based on the parent's state. This is all achieved with standard, declarative CSS, not complex and brittle JavaScript logic, offering a level of themeability and compositional power that is difficult to achieve in other systems.

By embracing these platform-native features, Flesh Cage allows you to build design systems that are not only bulletproof and predictable but also a genuine joy to extend and compose.
