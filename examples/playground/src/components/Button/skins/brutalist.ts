/**
 * Brutalist skin for Button
 */
export default `
  [part="surface"] {
    background: yellow;
    color: black;
    border: 4px solid black;
    border-radius: 0;
    padding: 12px 24px;
    font-size: 18px;
    font-weight: 900;
    font-family: 'Courier New', monospace;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 8px 8px 0 black;
    transition: all 0.1s ease;
  }

  [part="surface"]:hover {
    background: #ffff00;
    transform: translate(2px, 2px);
    box-shadow: 6px 6px 0 black;
  }

  [part="surface"]:active {
    transform: translate(4px, 4px);
    box-shadow: 4px 4px 0 black;
  }

  [part="surface"][data-variant="secondary"] {
    background: hotpink;
  }

  [part="label"] {
    display: inline-block;
  }
`
