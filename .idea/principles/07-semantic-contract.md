# Chapter 7: The Semantic Contract - Tags and Attributes as The True Interface

**Navigation**

- [Chapter 1: Project Overview](./01-project-overview.md)
- [Chapter 2: Theming vs. Skins](./02-skins-vs-themes.md)
- [Chapter 3: Lazy vs. Eager Loading](./03-lazy-vs-eager-loading.md)
- [Chapter 4: Runtime vs. Platform](./04-runtime-vs-platform.md)
- [Chapter 5: Design Systems](./05-design-systems.md)
- [Chapter 6: Specificity and Scope](./06-specificity-and-scope.md)
- **Chapter 7: The Semantic Contract**

---

**Table of Contents**

- [The Fragility of the Class-Based Contract](#the-fragility-of-the-class-based-contract)
- [The Resilient Contract: Semantic HTML](#the-resilient-contract-semantic-html)
- [Attributes: The Contract for State](#attributes-the-contract-for-state)
- [Appendix: A Lesson from the Past - CSS Zen Garden](#appendix-a-lesson-from-the-past---css-zen-garden)

A common and valid argument for the dominance of class-based styling is that class names form an essential "contract" between the markup (HTML) and the style (CSS). By creating a stable `class="product-card"`, developers ensure they can apply styles without making their CSS selectors dangerously dependent on a fragile DOM structure (`div > article > div:first-child`). In the world of the global namespace, this was a vital defensive tactic.

However, this perspective is an artifact of past limitations. Within an encapsulated component architecture, we can and should demand a better, more resilient contract—one that is based on the intrinsic nature of the content, not an arbitrary name.

## The Fragility of the Class-Based Contract

The contract provided by a class name is superficial. It describes an intended _presentation_, not an intrinsic _purpose_.

Consider the class `button`. A developer can, and often does, apply this class to any number of elements:

```html
<button class="button">I'm a real button</button>
<a href="#" class="button">I'm a link styled like a button</a>
<div role="button" tabindex="0" class="button">
  I'm a div pretending to be a button
</div>
```

If the CSS for `.button` includes rules like `[:disabled](https://developer.mozilla.org/en-US/docs/Web/CSS/:disabled)`, it will fail to apply correctly to the `<a>` and `<div>` elements. The contract was weak because the class name only described a visual intent, not the underlying semantics, accessibility, and behavior of the element itself. The contract is with the developer's naming scheme, not with the platform.

## The Resilient Contract: Semantic HTML

A far more robust contract is the HTML tag itself. The choice of a tag is a declaration of the content's fundamental **nature** and **function**.

- A `<button>` is content that performs an action.
- An `<a>` is content that navigates to a resource.
- An `<h1>` is the primary heading of a section.

This contract is resilient because you would only change a `<button>` to an `<a>` if its core purpose changes—a much rarer and more significant event than a visual redesign. By using the element type as our primary styling hook, we bind our styles to the unchanging nature of the content.

Flesh Cage's architecture is built on this premise. Within the encapsulated safety of a [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), we can shed the defensive conventions of the past and embrace simple, readable, and powerful type selectors. A skin for a `<styled-button>` can safely and unambiguously target `button` because it knows, with certainty, that it will only ever be styling the single `<button>` element defined in its component template.

## Attributes: The Contract for State

If the tag is the contract for _type_, then attributes are the contract for _state_.

The old way was to use modifier classes:

```html
<button class="button button--disabled">Submit</button>
<div class="tab tab--is-active">Profile</div>
```

This is another arbitrary, presentation-focused contract. The new, better contract uses the platform's native vocabulary for state, which is shared by browsers, accessibility devices, and our stylesheet.

- Instead of `.button--is-disabled`, we style the `[disabled]` attribute.
- Instead of `.tab--is-active`, we style the [`[aria-selected="true"]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-selected) attribute.
- Instead of `.accordion--is-open`, we style the [`[aria-expanded="true"]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded) attribute.

When combined, the contract a Flesh Cage component provides to its skin is incredibly powerful and semantic:

```css
/* skin.css for a styled-button */

/* The Type Contract: Style the element based on its nature. */
button {
  display: inline-flex;
  font-family: inherit;
  border: 1px solid;
}

/* The State Contract: Style the element based on its current state. */
button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

button[aria-pressed='true'] {
  background-color: var(--color-active-bg);
  border-color: var(--color-active-border);
}
```

This CSS is readable, self-documenting, and durable. It's not concerned with ephemeral class names, but with the fundamental nature of the element it's styling.

The idea of a contract is essential. But for too long, we have settled for the flimsy, arbitrary contract of class names because it was the best defense against the perils of a global scope. In the world of encapsulated components, the most robust and meaningful contract is the one the web platform has offered all along: **semantic tags for type, and standard attributes for state.**

---

### Appendix: A Lesson from the Past - CSS Zen Garden

This idea of separating a fixed structure from a swappable presentation is not new. It was proven with stunning clarity two decades ago by the **[CSS Zen Garden](http://www.csszengarden.com/)**.

Launched in 2003, the project was a challenge to web designers: take a single, fixed HTML file and radically redesign it using only CSS. The HTML file, which was semantically rich and full of IDs and classes, could not be altered. It was the immutable "contract."

The result was a breathtaking gallery of visual diversity. One designer would submit a stylesheet that rendered the page as a serene, minimalist blog. Another would render it as a gritty, textured movie poster. The HTML never changed, but the user experience was completely different.

CSS Zen Garden proved, unequivocally, that as long as the markup provides a stable and sufficiently descriptive contract, the presentation layer is infinitely malleable.

**Flesh Cage is the spiritual successor to this philosophy, modernized for the component era.**

- Where the Zen Garden had a single HTML file as its contract, Flesh Cage has the semantic template of an individual, encapsulated component.
- Where the Zen Garden relied on IDs and classes for its styling hooks, Flesh Cage elevates the contract to the more robust and meaningful level of tags, attributes, and [`::part`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) pseudo-elements.
- The swappable "skins" in Flesh Cage are the direct descendants of the stylesheets submitted to the Zen Garden, but now with the power of being scoped, lazy-loaded, and composable.

The lesson from the Zen Garden is as relevant today as it was twenty years ago: a well-defined semantic contract is the key that unlocks true creative and architectural freedom.
