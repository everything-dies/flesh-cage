# Attribute-Driven Styling Philosophy

**Version:** 0.1
**Date:** 2025-12-27
**Status:** Philosophy Documentation + Industry Resources

---

## The Principle

**Your library endorses semantic attributes (ARIA, data-*, schema.org) as the primary mechanism for styling component state, not prop interpolation in JavaScript.**

This aligns with:
- Semantic HTML principles
- Accessibility-first design
- Progressive enhancement
- CSS as a design medium
- Performance optimization

---

## The Problem with Prop Interpolation (CSS-in-JS)

### Traditional CSS-in-JS Approach

```javascript
// styled-components / emotion pattern
const Button = styled.button`
  background: ${props => props.variant === 'primary' ? '#2196f3' : '#757575'};
  padding: ${props => props.size === 'large' ? '1rem 2rem' : '0.5rem 1rem'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  color: ${props => props.variant === 'primary' ? 'white' : 'black'};
  border-radius: ${props => props.rounded ? '24px' : '4px'};
`

// Usage
<Button variant="primary" size="large" disabled rounded>
  Click Me
</Button>
```

### Problems with This Approach

#### 1. **Performance Issues**

From [styled-components FAQ](https://styled-components.com/docs/faqs):

> When using prop interpolations, whenever these values change, styled-components will need to re-generate the class and re-inject it into the document's `<head>`, which can be a performance liability in certain cases (e.g., doing JS animations).

**Impact:**
- Every prop change = new class generation
- New class injection into `<head>`
- CSSOM rebuild
- Layout recalculation

From [emotion performance analysis](https://medium.com/@tkh44/emotion-ad1c45c6d28b):
> In benchmarks that change dynamic values in style blocks very quickly, emotion showed over 25× faster performance when using CSS variables instead of prop interpolations.

#### 2. **Runtime Overhead**

```javascript
// Every render with different props
<Button variant="primary" />   // Generates class .sc-a1
<Button variant="secondary" />  // Generates class .sc-a2
<Button variant="primary" />   // May reuse .sc-a1 or generate .sc-a3

// Runtime cost:
// 1. Execute interpolation function
// 2. Generate CSS string
// 3. Hash the CSS
// 4. Check cache
// 5. Create/inject style tag if new
```

#### 3. **Hard to Override Externally**

```css
/* How do you style this externally? */
.my-button { /* ❌ Doesn't work - props control styles */ }

/* Need to understand prop logic */
.my-button[data-variant="primary"] { /* Maybe? */ }
```

#### 4. **Couples Logic to Styling**

```javascript
// Logic mixed with styling
const getBackground = (variant) => {
  switch(variant) {
    case 'primary': return '#2196f3'
    case 'secondary': return '#757575'
    case 'danger': return '#f44336'
    default: return 'transparent'
  }
}

// Now styling requires JavaScript understanding
```

#### 5. **Accessibility is Separate**

```jsx
// Developer must remember BOTH
<Button
  variant="primary"        // For styling
  aria-pressed={isActive}  // For accessibility (often forgotten)
  disabled={isDisabled}    // For both? Or just styling?
>
```

---

## The Attribute-Driven Alternative

### Your Library's Approach

```typescript
// Component sets semantic attributes
export const Button = ({ variant, size, pressed, ...props }) => (
  <button
    part="surface"
    variant={variant}           // Styling hook
    size={size}                 // Styling hook
    aria-pressed={pressed}      // Accessibility + styling hook
    {...props}
  >
    <span part="label">{props.children}</span>
  </button>
)
```

```css
/* Skin styles based on attributes (NO JavaScript) */

/* Variant styling */
[part="surface"][variant="primary"] {
  background: #2196f3;
  color: white;
}

[part="surface"][variant="secondary"] {
  background: #757575;
  color: white;
}

/* Size styling */
[part="surface"][size="large"] {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

[part="surface"][size="small"] {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* State styling (using ARIA) */
[part="surface"][aria-pressed="true"] {
  background: #1976d2;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

[part="surface"][disabled],
[part="surface"][aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Combination selectors */
[part="surface"][variant="primary"][size="large"] {
  /* Specific combination styling */
}
```

### Benefits

#### 1. **Zero Runtime Cost**

- No JavaScript interpolation
- No class generation
- No style injection
- Pure CSS matching (browser-native, extremely fast)

From [Josh W. Comeau on styled-components best practices](https://www.joshwcomeau.com/css/styled-components/):
> The styled-components FAQ recommends using CSS variables passed through the style prop for frequently-changing values to avoid the runtime cost of class regeneration.

With attributes, this is **automatic** - no runtime cost at all.

#### 2. **Accessibility Baked In**

From [Ben Myers: Style with Stateful, Semantic Selectors](https://benmyers.dev/blog/semantic-selectors/):

> Using ARIA attributes as CSS selectors ensures that you can't accidentally omit necessary accessible semantics. If your visual styling is keyed to the ARIA property that conveys state programmatically, getting that ARIA property wrong will have two effects — a broken interface and a weird icon, so addressing the accessibility issue will fix the visual style.

**Example:**
```css
/* Button that requires aria-pressed */
button[aria-pressed="true"] {
  background: green;
}

/* If developer forgets aria-pressed: */
/* ❌ Button doesn't look pressed */
/* ❌ Screen reader doesn't announce pressed state */
/* → Both bugs are visible/audible immediately */
```

From [ARIA in CSS on CSS-Tricks](https://css-tricks.com/aria-in-css/):

> If a state is important enough to indicate visually, it's probably important enough to expose to assistive technologies.

#### 3. **Explicit State Management**

From [Use data attributes instead of HTML classes to represent state](https://www.30secondsofcode.org/html/s/data-attributes-as-state/):

> Data attributes for representing state in HTML are more flexible and scalable than using classes. This approach eliminates invalid states, allows static analysis for valid values via linting or type checking, and makes toggling variants more intuitive with simpler JavaScript.

**Example:**
```javascript
// Can't have conflicting states
element.setAttribute('data-state', 'loading')  // ✅ One state
// vs
element.classList.add('loading')  // ❌ Could also have 'success' class
element.classList.add('success') // ❌ Now two states? Which wins?
```

From [Using data attributes instead of CSS classes](https://medium.com/@matt.dawkins/using-data-attributes-instead-of-css-classes-78476535b111):

> You can't run into the issue of having two states on the same element because the data attribute selector needs to match exactly. This prevents conflicts that can occur when multiple classes are applied.

#### 4. **Semantic and Inspectable**

```html
<!-- Inspecting in DevTools -->
<button part="surface" variant="primary" size="large" aria-pressed="true">
  Click Me
</button>

<!-- State is VISIBLE in the DOM tree -->
<!-- Not hidden in JavaScript logic -->
<!-- Designer/QA can see exact state -->
```

From [Semantic CSS Styles Using Data Attributes](https://infotrust.com/articles/semantic-css-styles-using-data-attributes/):

> With data-* attributes, you get on/off ability plus the ability to select based on the value at the same specificity level. Attribute selectors have the same specificity as a class.

#### 5. **Externally Styleable via Shadow Parts**

```css
/* Outside the component */
my-button::part(surface)[variant="primary"] {
  /* ✅ Works! Can style based on attributes */
  background: var(--brand-primary);
}

my-button::part(surface)[aria-pressed="true"] {
  /* ✅ Can target pressed state */
  transform: scale(0.98);
}
```

This is **impossible** with prop interpolation - external CSS can't access JavaScript props.

---

## Industry Validation

### Ben Frain's Enduring CSS (ECSS)

From [ECSS Chapter 6: Dealing with State](https://ecss.benfrain.com/chapter6.html):

> For styling hooks related to state, where possible, use ARIA attributes. Not only does this make it easy to style from a CSS perspective, it also means you are more likely to make an accessible web application.

**ECSS State Hooks:**
```css
[aria-selected="true"] { }
[aria-expanded="true"] { }
[aria-current="page"] { }
[aria-busy="true"] { }
```

### Heydon Pickering's Inclusive Components

From [Inclusive Components review](https://dev.to/digital-theatre/inclusive-components-by-heydon-pickering-a-chapter-by-chapter-review-1m3c):

> Heydon Pickering's work explores how web developers can create accessible components with semantic HTML, and how we can avoid using JavaScript unnecessarily by leveraging CSS to add both functionality and styling to our web pages.

From [Accessibility Through Semantic HTML](https://24ways.org/2017/accessibility-through-semantic-html/):

> Understanding how assistive technology announces the DOM was very helpful for understanding why semantic HTML choices are so important. An understanding of different assistive technologies, and willingness to test with them, is just as important.

Key principle: **Query the extant, functional nature of semantic HTML in such a way as to reward well-formed markup.**

### Adrian Roselli: Using CSS to Enforce Accessibility

From [Using CSS to Enforce Accessibility](https://adrianroselli.com/2021/06/using-css-to-enforce-accessibility.html):

> CSS can be used to enforce accessibility by making incorrect implementations visually broken, forcing developers to fix the underlying semantic issues.

**Example:**
```css
/* Button without aria-label or text content */
button:not([aria-label]):empty {
  outline: 5px solid red;
}

/* This makes the bug VISIBLE during development */
```

### Elise Hein: The Wasted Potential of CSS Attribute Selectors

From [The wasted potential of CSS attribute selectors](https://elisehe.in/2022/10/16/attribute-selectors):

> CSS attribute selectors are more flexible and scalable than classes, forcing developers to be more explicit and more debuggable. This eliminates invalid states.

**Attribute selectors enable:**
- Exact matching: `[attr="value"]`
- Contains: `[attr*="value"]`
- Starts with: `[attr^="value"]`
- Ends with: `[attr$="value"]`
- Word matching: `[attr~="value"]`

---

## Real-World Patterns

### Pattern 1: Toggle Button

**Component:**
```typescript
export const ToggleButton = ({ pressed, onToggle, children }) => (
  <button
    part="surface"
    role="button"
    aria-pressed={pressed}
    onClick={onToggle}
  >
    {children}
  </button>
)
```

**Skin:**
```css
/* Normal state */
[part="surface"][aria-pressed="false"] {
  background: #e0e0e0;
  color: #333;
}

/* Pressed state */
[part="surface"][aria-pressed="true"] {
  background: #2196f3;
  color: white;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* Accessibility = styling (single source of truth) */
```

### Pattern 2: Form Input with Validation

**Component:**
```typescript
export const Input = ({ invalid, value, onChange }) => (
  <input
    part="field"
    type="text"
    aria-invalid={invalid}
    value={value}
    onChange={onChange}
  />
)
```

**Skin:**
```css
/* Valid state */
[part="field"][aria-invalid="false"] {
  border: 2px solid #4caf50;
}

/* Invalid state */
[part="field"][aria-invalid="true"] {
  border: 2px solid #f44336;
}

/* Focus states combined with validation */
[part="field"][aria-invalid="true"]:focus {
  outline: 2px solid #f44336;
  outline-offset: 2px;
}
```

### Pattern 3: Loading Button

**Component:**
```typescript
export const AsyncButton = ({ loading, disabled, onClick, children }) => (
  <button
    part="surface"
    aria-busy={loading}
    aria-disabled={disabled || loading}
    disabled={disabled || loading}
    onClick={onClick}
  >
    <span part="label">{children}</span>
    {loading && <span part="spinner" aria-hidden="true" />}
  </button>
)
```

**Skin:**
```css
/* Normal state */
[part="surface"] {
  position: relative;
}

/* Busy state */
[part="surface"][aria-busy="true"] {
  cursor: wait;
}

/* Hide label during loading */
[part="surface"][aria-busy="true"] [part="label"] {
  opacity: 0;
}

/* Show and animate spinner */
[part="spinner"] {
  display: none;
}

[part="surface"][aria-busy="true"] [part="spinner"] {
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Disabled state (semantic attribute) */
[part="surface"][aria-disabled="true"],
[part="surface"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Pattern 4: Tab Panel

**Component:**
```typescript
export const Tab = ({ selected, id, controls, onClick, children }) => (
  <button
    part="tab"
    role="tab"
    id={id}
    aria-selected={selected}
    aria-controls={controls}
    tabIndex={selected ? 0 : -1}
    onClick={onClick}
  >
    {children}
  </button>
)
```

**Skin:**
```css
/* Tab styles */
[part="tab"] {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.75rem 1.5rem;
}

/* Selected state */
[part="tab"][aria-selected="true"] {
  border-bottom-color: #2196f3;
  color: #2196f3;
  font-weight: 600;
}

/* Hover (only for non-selected) */
[part="tab"][aria-selected="false"]:hover {
  background: rgba(0,0,0,0.05);
}

/* Focus visible */
[part="tab"]:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: -2px;
}
```

### Pattern 5: Accordion with Schema.org Markup

**Component:**
```typescript
export const AccordionItem = ({ expanded, onToggle, question, answer }) => (
  <div itemScope itemType="https://schema.org/Question">
    <button
      part="trigger"
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <span part="question" itemProp="name">{question}</span>
    </button>
    <div
      part="panel"
      hidden={!expanded}
      itemScope
      itemType="https://schema.org/Answer"
      itemProp="acceptedAnswer"
    >
      <div part="answer" itemProp="text">{answer}</div>
    </div>
  </div>
)
```

**Skin:**
```css
/* Trigger styling based on expanded state */
[part="trigger"][aria-expanded="false"]::after {
  content: '+';
  transform: rotate(0deg);
  transition: transform 0.2s;
}

[part="trigger"][aria-expanded="true"]::after {
  content: '+';
  transform: rotate(45deg);
}

/* Panel visibility controlled by HTML hidden attribute */
[part="panel"][hidden] {
  display: none;
}

[part="panel"]:not([hidden]) {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Comparison Table

| Aspect | Prop Interpolation (CSS-in-JS) | Attribute-Driven (Your Library) |
|--------|--------------------------------|----------------------------------|
| **Performance** | ❌ Runtime class generation | ✅ Native CSS matching |
| **Runtime cost** | ❌ Interpolation on every render | ✅ Zero JavaScript |
| **Accessibility** | ⚠️ Separate concern | ✅ Styling = accessibility |
| **Inspectability** | ❌ Hidden in JS logic | ✅ Visible in DOM |
| **External styling** | ❌ Can't access props | ✅ Can style via ::part() |
| **State conflicts** | ❌ Multiple classes can conflict | ✅ Attribute = single value |
| **Type safety** | ✅ Props are typed | ✅ Can type attributes |
| **Learning curve** | ⚠️ Need to learn template syntax | ✅ Just CSS selectors |
| **Bundle size** | ❌ CSS-in-JS runtime | ✅ Zero runtime |
| **HMR** | ⚠️ Component re-renders | ✅ CSS hot-replaces |
| **Progressive enhancement** | ❌ Requires JS | ✅ Works without JS |

---

## Schema.org Integration

### Why Schema.org Matters

**Schema.org** provides semantic vocabulary for structured data. Using it for styling hooks adds another layer of meaning.

From [HTML Data Attributes Guide on CSS-Tricks](https://css-tricks.com/a-complete-guide-to-data-attributes/):

> Data attributes allow you to store extra information on HTML elements without using non-semantic attributes.

**Schema.org goes further:** Provides semantic meaning recognized by search engines and assistive technology.

### Example: Product Card

**Component:**
```typescript
export const ProductCard = ({ name, price, rating, image }) => (
  <article
    part="container"
    itemScope
    itemType="https://schema.org/Product"
  >
    <img part="image" src={image} alt={name} itemProp="image" />
    <h3 part="name" itemProp="name">{name}</h3>
    <div
      part="price"
      itemProp="offers"
      itemScope
      itemType="https://schema.org/Offer"
    >
      <span itemProp="price">${price}</span>
    </div>
    <div
      part="rating"
      itemProp="aggregateRating"
      itemScope
      itemType="https://schema.org/AggregateRating"
      data-rating={Math.floor(rating)}
    >
      <span itemProp="ratingValue">{rating}</span>
    </div>
  </article>
)
```

**Skin:**
```css
/* Style based on rating value */
[part="rating"][data-rating="5"] {
  color: #4caf50;
}

[part="rating"][data-rating="4"] {
  color: #8bc34a;
}

[part="rating"][data-rating="3"] {
  color: #ffc107;
}

[part="rating"][data-rating="2"],
[part="rating"][data-rating="1"] {
  color: #f44336;
}

/* Style offers based on availability */
[part="price"][itemType*="Offer"][itemProp*="availability"][content="InStock"]::after {
  content: "✓ In Stock";
  color: #4caf50;
}

[part="price"][itemType*="Offer"][itemProp*="availability"][content="OutOfStock"]::after {
  content: "✗ Out of Stock";
  color: #f44336;
}
```

**Benefits:**
- ✅ Semantic HTML for SEO
- ✅ Structured data for search engines
- ✅ Styling hooks that carry meaning
- ✅ Single source of truth

---

## Progressive Enhancement

From [ARIA in CSS by Jeremy Keith](https://adactio.medium.com/aria-in-css-d4b7c16bbe45):

> ARIA attributes are typically added by JavaScript at runtime, so if JavaScript fails and the aria-hidden value isn't set to "true", the CSS never kicks in and the default state is for content to be displayed.

**Example:**
```css
/* Progressive enhancement pattern */
[aria-hidden="true"] {
  display: none;
}

/* If JS fails: */
/* - aria-hidden is never set */
/* - CSS rule doesn't match */
/* - Content remains visible (good fallback!) */
```

---

## Implementation in Your Library

### Recommended API

```typescript
// Component author defines semantic contract
export const Button = createShadowComponent({
  name: 'button',

  // Declare which attributes affect styling
  styleAttributes: ['variant', 'size'],

  // ARIA attributes automatically tracked
  ariaAttributes: ['pressed', 'disabled', 'busy'],

  skins: {
    material: () => import('./material.css'),
    brutalist: () => import('./brutalist.css'),
  },

  render: ({ variant, size, pressed, busy, disabled, children }) => (
    <button
      part="surface"
      variant={variant}
      size={size}
      aria-pressed={pressed}
      aria-busy={busy}
      aria-disabled={disabled}
      disabled={disabled}
    >
      <span part="label">{children}</span>
    </button>
  )
})
```

### Type Safety

```typescript
// Generate types from styleAttributes
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  pressed?: boolean
  busy?: boolean
  disabled?: boolean
  children: React.ReactNode
}

// Validate at compile time
<Button variant="primary" size="large" />  // ✅
<Button variant="invalid" />               // ❌ Type error
```

---

## Resources

### Core Articles

1. [Style with Stateful, Semantic Selectors](https://benmyers.dev/blog/semantic-selectors/) - Ben Myers
2. [The wasted potential of CSS attribute selectors](https://elisehe.in/2022/10/16/attribute-selectors) - Elise Hein
3. [ECSS Chapter 6: Dealing with State](https://ecss.benfrain.com/chapter6.html) - Ben Frain
4. [ARIA in CSS](https://css-tricks.com/aria-in-css/) - CSS-Tricks
5. [Using CSS to Enforce Accessibility](https://adrianroselli.com/2021/06/using-css-to-enforce-accessibility.html) - Adrian Roselli

### Data Attributes

6. [Use data attributes instead of HTML classes to represent state](https://www.30secondsofcode.org/html/s/data-attributes-as-state/) - 30 Seconds of Code
7. [Using data attributes instead of CSS classes](https://medium.com/@matt.dawkins/using-data-attributes-instead-of-css-classes-78476535b111) - Matt Dawkins
8. [Semantic CSS Styles Using Data Attributes](https://infotrust.com/articles/semantic-css-styles-using-data-attributes/) - InfoTrust
9. [HTML Data Attributes Guide](https://css-tricks.com/a-complete-guide-to-data-attributes/) - CSS-Tricks

### CSS-in-JS Performance

10. [styled-components FAQs](https://styled-components.com/docs/faqs) - styled-components docs
11. [The styled-components Happy Path](https://www.joshwcomeau.com/css/styled-components/) - Josh W. Comeau
12. [emotion: The Next Generation of CSS-in-JS](https://medium.com/@tkh44/emotion-ad1c45c6d28b) - Kye Hohenberger

### Inclusive Components

13. [Inclusive Components review](https://dev.to/digital-theatre/inclusive-components-by-heydon-pickering-a-chapter-by-chapter-review-1m3c) - DEV Community
14. [Accessibility Through Semantic HTML](https://24ways.org/2017/accessibility-through-semantic-html/) - 24 Ways
15. [Meet "Inclusive Components"](https://www.smashingmagazine.com/2019/11/inclusive-components-prerelease/) - Smashing Magazine

---

## Conclusion

### Your Library's Philosophy is Industry-Validated

By endorsing attribute-driven styling over prop interpolation, your library:

1. ✅ **Improves performance** (zero runtime cost)
2. ✅ **Enforces accessibility** (styling = semantic attributes)
3. ✅ **Enables external styling** (::part() with attributes)
4. ✅ **Provides clarity** (state visible in DOM)
5. ✅ **Supports progressive enhancement** (graceful degradation)
6. ✅ **Honors semantic HTML** (attributes carry meaning)

### This Completes the Vision

Combined with skins (not themes) and CSS Zen Garden philosophy, you're building:

**A CSS-first component library that honors:**
- Semantic HTML (attributes, ARIA, schema.org)
- Accessibility-first design (styling enforces semantics)
- CSS as an expressive medium (complete visual freedom)
- Performance (zero runtime, native browser features)
- Progressive enhancement (works without JavaScript)

**This is the web platform as it was meant to be used.**

---

**Status:** Philosophy documented with industry validation.
**Next:** Incorporate into API design (DESIGN_REVIEW v0.2).
