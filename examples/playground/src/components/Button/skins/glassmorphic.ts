/**
 * Glassmorphic skin for Button
 */
export default `
  [part="surface"] {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 14px 28px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow:
      0 8px 32px 0 rgba(31, 38, 135, 0.37),
      inset 0 1px 1px rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }

  [part="surface"]:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow:
      0 12px 40px 0 rgba(31, 38, 135, 0.45),
      inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }

  [part="surface"]:active {
    transform: translateY(0);
    box-shadow:
      0 4px 16px 0 rgba(31, 38, 135, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.2);
  }

  [part="surface"][data-variant="secondary"] {
    background: rgba(100, 100, 100, 0.15);
  }

  [part="label"] {
    display: inline-block;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
`
