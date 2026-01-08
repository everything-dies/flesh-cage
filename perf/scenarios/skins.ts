// perf/scenarios/skins.ts
// A simplified skin definition for profiling scenarios.
// In a real scenario, you might want to dynamically import these
// as shown in the original playground example.

const materialSkin = {
  base: {
    backgroundColor: '#6200ee',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    boxShadow:
      '0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.2)',
    transition: 'box-shadow 0.2s ease-in-out',
  },
  ':hover': {
    boxShadow:
      '0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.2)',
  },
}

export const skins = {
  material: () => Promise.resolve({ default: materialSkin }),
  brutalist: () =>
    Promise.resolve({ default: { base: { border: '2px solid black' } } }),
  glassmorphic: () =>
    Promise.resolve({ default: { base: { backdropFilter: 'blur(10px)' } } }),
}
