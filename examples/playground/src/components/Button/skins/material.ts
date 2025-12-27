/**
 * Material Design skin for Button
 */
export default `
  [part="surface"] {
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  [part="surface"]:hover {
    background: #1976d2;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }

  [part="surface"]:active {
    background: #1565c0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transform: translateY(0);
  }

  [part="surface"][data-variant="secondary"] {
    background: #757575;
  }

  [part="surface"][data-variant="secondary"]:hover {
    background: #616161;
  }

  [part="label"] {
    display: inline-block;
  }
`
