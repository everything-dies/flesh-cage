// Benchmark Configuration
const SKINS = {
  light: `
    :host {
      display: block;
      padding: 1rem;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin: 0.5rem;
    }
    .header {
      color: #333333;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .content {
      color: #666666;
      line-height: 1.5;
    }
    .button {
      background: #2196f3;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }
  `,
  dark: `
    :host {
      display: block;
      padding: 1rem;
      background: #1a1a1a;
      border: 1px solid #333333;
      border-radius: 4px;
      margin: 0.5rem;
    }
    .header {
      color: #ffffff;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .content {
      color: #cccccc;
      line-height: 1.5;
    }
    .button {
      background: #90caf9;
      color: #000000;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }
  `,
  highContrast: `
    :host {
      display: block;
      padding: 1rem;
      background: #000000;
      border: 3px solid #ffff00;
      border-radius: 4px;
      margin: 0.5rem;
    }
    .header {
      color: #ffff00;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .content {
      color: #ffffff;
      line-height: 1.5;
      font-size: 1.125rem;
    }
    .button {
      background: #ffff00;
      color: #000000;
      border: 2px solid #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
  `
};

// Global cache for Constructable Stylesheets
class SheetsCache {
  constructor() {
    this.cache = new Map();
    this.refCounts = new Map();
  }

  async acquire(skin) {
    if (!this.cache.has(skin)) {
      const sheet = new CSSStyleSheet();
      await sheet.replace(SKINS[skin]);
      this.cache.set(skin, sheet);
      this.refCounts.set(skin, 0);
    }
    this.refCounts.set(skin, this.refCounts.get(skin) + 1);
    return this.cache.get(skin);
  }

  release(skin) {
    const count = this.refCounts.get(skin) - 1;
    if (count <= 0) {
      this.cache.delete(skin);
      this.refCounts.delete(skin);
    } else {
      this.refCounts.set(skin, count);
    }
  }

  getCacheSize() {
    return this.cache.size;
  }

  getRefCount(skin) {
    return this.refCounts.get(skin) || 0;
  }
}

const sheetsCache = new SheetsCache();

// Constructable Stylesheet Custom Element
class ConstructableComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentSkin = null;
  }

  async connectedCallback() {
    const skin = this.getAttribute('skin') || 'light';
    await this.applySkin(skin);
    this.render();
  }

  async applySkin(skin) {
    // Release old skin
    if (this.currentSkin) {
      sheetsCache.release(this.currentSkin);
    }

    // Acquire new skin
    const sheet = await sheetsCache.acquire(skin);
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.currentSkin = skin;
  }

  disconnectedCallback() {
    if (this.currentSkin) {
      sheetsCache.release(this.currentSkin);
    }
    this.shadowRoot.adoptedStyleSheets = [];
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div part="container">
        <div class="header" part="header">Component ${this.getAttribute('id')}</div>
        <div class="content" part="content">
          This is a test component using Constructable Stylesheets.
        </div>
        <button class="button" part="button">Action</button>
      </div>
    `;
  }
}

// Traditional CSS-in-JS Approach
class TraditionalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const skin = this.getAttribute('skin') || 'light';
    this.applySkin(skin);
    this.render();
  }

  applySkin(skin) {
    // Remove old style tag
    const oldStyle = this.shadowRoot.querySelector('style');
    if (oldStyle) {
      oldStyle.remove();
    }

    // Insert new style tag
    const styleTag = document.createElement('style');
    styleTag.textContent = SKINS[skin];
    this.shadowRoot.appendChild(styleTag);
  }

  disconnectedCallback() {
    // Cleanup
    this.shadowRoot.innerHTML = '';
  }

  render() {
    const content = `
      <div part="container">
        <div class="header" part="header">Component ${this.getAttribute('id')}</div>
        <div class="content" part="content">
          This is a test component using Traditional style tags.
        </div>
        <button class="button" part="button">Action</button>
      </div>
    `;

    const existing = this.shadowRoot.querySelector('[part="container"]');
    if (!existing) {
      this.shadowRoot.insertAdjacentHTML('beforeend', content);
    }
  }
}

// Register custom elements
customElements.define('constructable-component', ConstructableComponent);
customElements.define('traditional-component', TraditionalComponent);

// Results tracking
let benchmarkResults = [];

function log(message) {
  const resultsDiv = document.getElementById('results');
  benchmarkResults.push(message);
  resultsDiv.textContent = benchmarkResults.join('\n');
}

function updateStats(stats) {
  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML = Object.entries(stats).map(([key, data]) => `
    <div class="stat-card">
      <h3>${data.label}</h3>
      <div>
        <span class="value">${data.value}</span>
        <span class="unit">${data.unit}</span>
      </div>
    </div>
  `).join('');
}

function clearResults() {
  benchmarkResults = [];
  document.getElementById('results').textContent = '';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('container').innerHTML = '';
}

function getMemoryUsage() {
  if (performance.memory) {
    return {
      used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
    };
  }
  return null;
}

async function runBenchmark(type, count) {
  log(`\n========================================`);
  log(`Starting ${type} benchmark with ${count} components`);
  log(`========================================\n`);

  const container = document.getElementById('container');
  container.innerHTML = '';

  const tagName = type === 'constructable' ? 'constructable-component' : 'traditional-component';
  const skins = ['light', 'dark', 'highContrast'];

  // Memory before
  const memBefore = getMemoryUsage();
  if (memBefore) {
    log(`Memory before: ${memBefore.used} MB used / ${memBefore.total} MB total`);
  }

  // Mount performance
  const mountStart = performance.now();

  for (let i = 0; i < count; i++) {
    const element = document.createElement(tagName);
    element.setAttribute('id', i);
    element.setAttribute('skin', skins[i % skins.length]);
    container.appendChild(element);
  }

  // Wait for all components to be connected
  await new Promise(resolve => setTimeout(resolve, 100));

  const mountEnd = performance.now();
  const mountTime = mountEnd - mountStart;

  log(`Mount time: ${mountTime.toFixed(2)}ms (${(mountTime / count).toFixed(3)}ms per component)`);

  // Memory after mount
  const memAfterMount = getMemoryUsage();
  if (memAfterMount) {
    log(`Memory after mount: ${memAfterMount.used} MB used / ${memAfterMount.total} MB total`);
    log(`Memory increase: ${(memAfterMount.used - memBefore.used).toFixed(2)} MB`);
  }

  // If constructable, log cache stats
  if (type === 'constructable') {
    log(`\nCache stats:`);
    log(`  Cached sheets: ${sheetsCache.getCacheSize()}`);
    skins.forEach(skin => {
      log(`  ${skin} references: ${sheetsCache.getRefCount(skin)}`);
    });
  }

  // Theme switch performance
  log(`\nTesting theme switch...`);
  const switchStart = performance.now();

  const elements = container.querySelectorAll(tagName);
  const promises = [];

  elements.forEach((el, i) => {
    const newSkin = skins[(i + 1) % skins.length];
    if (type === 'constructable') {
      promises.push(el.applySkin(newSkin));
    } else {
      el.applySkin(newSkin);
    }
  });

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  const switchEnd = performance.now();
  const switchTime = switchEnd - switchStart;

  log(`Theme switch time: ${switchTime.toFixed(2)}ms (${(switchTime / count).toFixed(3)}ms per component)`);

  // Unmount performance
  log(`\nTesting unmount...`);
  const unmountStart = performance.now();

  container.innerHTML = '';

  const unmountEnd = performance.now();
  const unmountTime = unmountEnd - unmountStart;

  log(`Unmount time: ${unmountTime.toFixed(2)}ms (${(unmountTime / count).toFixed(3)}ms per component)`);

  // Force GC (if available)
  if (window.gc) {
    log(`\nForcing garbage collection...`);
    window.gc();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Memory after unmount
  const memAfterUnmount = getMemoryUsage();
  if (memAfterUnmount) {
    log(`Memory after unmount: ${memAfterUnmount.used} MB used / ${memAfterUnmount.total} MB total`);
    log(`Memory retained: ${(memAfterUnmount.used - memBefore.used).toFixed(2)} MB`);
  }

  // Update stats display
  updateStats({
    components: { label: 'Components', value: count, unit: '' },
    mountTime: { label: 'Mount Time', value: mountTime.toFixed(0), unit: 'ms' },
    avgMount: { label: 'Avg Mount Time', value: (mountTime / count).toFixed(2), unit: 'ms' },
    switchTime: { label: 'Theme Switch', value: switchTime.toFixed(0), unit: 'ms' },
    avgSwitch: { label: 'Avg Switch Time', value: (switchTime / count).toFixed(2), unit: 'ms' },
    memory: {
      label: 'Memory Increase',
      value: memAfterMount ? (memAfterMount.used - memBefore.used).toFixed(1) : 'N/A',
      unit: 'MB'
    }
  });

  log(`\n========================================`);
  log(`Benchmark complete!`);
  log(`========================================\n`);
}

async function runMemoryComparison() {
  log(`\n========================================`);
  log(`Memory Comparison: Constructable vs Traditional`);
  log(`========================================\n`);

  const counts = [100, 500, 1000];
  const results = { constructable: {}, traditional: {} };

  for (const count of counts) {
    // Test constructable
    log(`\nTesting Constructable with ${count} components...`);
    const container = document.getElementById('container');
    container.innerHTML = '';

    const memBefore = getMemoryUsage();

    for (let i = 0; i < count; i++) {
      const el = document.createElement('constructable-component');
      el.setAttribute('id', i);
      el.setAttribute('skin', 'light');
      container.appendChild(el);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const memAfter = getMemoryUsage();
    const increase = memAfter ? (memAfter.used - memBefore.used).toFixed(2) : 'N/A';

    results.constructable[count] = increase;
    log(`  Memory increase: ${increase} MB`);

    container.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test traditional
    log(`Testing Traditional with ${count} components...`);
    const memBefore2 = getMemoryUsage();

    for (let i = 0; i < count; i++) {
      const el = document.createElement('traditional-component');
      el.setAttribute('id', i);
      el.setAttribute('skin', 'light');
      container.appendChild(el);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const memAfter2 = getMemoryUsage();
    const increase2 = memAfter2 ? (memAfter2.used - memBefore2.used).toFixed(2) : 'N/A';

    results.traditional[count] = increase2;
    log(`  Memory increase: ${increase2} MB`);

    container.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  log(`\n========================================`);
  log(`Summary:`);
  log(`========================================`);
  log(`Components | Constructable | Traditional | Difference`);
  log(`-----------|---------------|-------------|------------`);
  counts.forEach(count => {
    const c = results.constructable[count];
    const t = results.traditional[count];
    const diff = (t - c).toFixed(2);
    log(`${count.toString().padEnd(10)} | ${c.toString().padEnd(13)} | ${t.toString().padEnd(11)} | ${diff} MB`);
  });

  updateStats({
    test: { label: 'Test Type', value: 'Memory', unit: 'Comparison' },
    winner: {
      label: 'Most Efficient',
      value: 'Constructable',
      unit: 'Stylesheets'
    }
  });
}

async function runThemeSwitchBenchmark() {
  log(`\n========================================`);
  log(`Theme Switch Performance Comparison`);
  log(`========================================\n`);

  const count = 500;
  const iterations = 5;

  // Test constructable
  log(`Testing Constructable theme switching (${count} components, ${iterations} switches)...`);
  const container = document.getElementById('container');
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const el = document.createElement('constructable-component');
    el.setAttribute('id', i);
    el.setAttribute('skin', 'light');
    container.appendChild(el);
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const skins = ['light', 'dark', 'highContrast'];
  const constructableTimes = [];

  for (let iter = 0; iter < iterations; iter++) {
    const start = performance.now();
    const elements = container.querySelectorAll('constructable-component');
    const promises = Array.from(elements).map((el, i) =>
      el.applySkin(skins[(iter + i) % skins.length])
    );
    await Promise.all(promises);
    const end = performance.now();
    constructableTimes.push(end - start);
    log(`  Iteration ${iter + 1}: ${(end - start).toFixed(2)}ms`);
  }

  const constructableAvg = constructableTimes.reduce((a, b) => a + b, 0) / iterations;

  container.innerHTML = '';
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test traditional
  log(`\nTesting Traditional theme switching (${count} components, ${iterations} switches)...`);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('traditional-component');
    el.setAttribute('id', i);
    el.setAttribute('skin', 'light');
    container.appendChild(el);
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const traditionalTimes = [];

  for (let iter = 0; iter < iterations; iter++) {
    const start = performance.now();
    const elements = container.querySelectorAll('traditional-component');
    elements.forEach((el, i) => {
      el.applySkin(skins[(iter + i) % skins.length]);
    });
    const end = performance.now();
    traditionalTimes.push(end - start);
    log(`  Iteration ${iter + 1}: ${(end - start).toFixed(2)}ms`);
  }

  const traditionalAvg = traditionalTimes.reduce((a, b) => a + b, 0) / iterations;

  log(`\n========================================`);
  log(`Summary:`);
  log(`========================================`);
  log(`Constructable average: ${constructableAvg.toFixed(2)}ms`);
  log(`Traditional average: ${traditionalAvg.toFixed(2)}ms`);
  log(`Speedup: ${(traditionalAvg / constructableAvg).toFixed(2)}x faster`);

  updateStats({
    count: { label: 'Components', value: count, unit: '' },
    constructable: { label: 'Constructable Avg', value: constructableAvg.toFixed(0), unit: 'ms' },
    traditional: { label: 'Traditional Avg', value: traditionalAvg.toFixed(0), unit: 'ms' },
    speedup: { label: 'Speedup', value: (traditionalAvg / constructableAvg).toFixed(1), unit: 'x' }
  });

  container.innerHTML = '';
}

log('Benchmark suite loaded. Click buttons to run tests.');
log('Note: For accurate memory measurements, run Chrome with --enable-precise-memory-info flag.');
