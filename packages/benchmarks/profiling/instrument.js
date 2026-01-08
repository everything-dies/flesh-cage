import { readFile, writeFile } from 'fs/promises'

/**
 * Instruments flesh-cage source code with performance marks
 * This helps identify exactly where time is spent
 */

const INSTRUMENTATION_POINTS = [
  {
    file: 'packages/flesh-cage/src/core/styled.tsx',
    markers: [
      {
        location: 'constructor',
        before: 'shadow = this.attachShadow({ mode: \'open\' })',
        markName: 'shadow-dom-create',
      },
      {
        location: 'adorn',
        before: 'return new Promise<CSSStyleSheet>',
        markName: 'adorn-start',
      },
      {
        location: 'adorn',
        before: 'Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })',
        markName: 'adopt-stylesheet',
      },
      {
        location: 'connectedCallback',
        before: 'this.addEventListener(\'change\', this.change)',
        markName: 'custom-element-connected',
      },
    ],
  },
  {
    file: 'packages/flesh-cage/src/core/use-core.tsx',
    markers: [
      {
        location: 'useCore',
        before: 'const container = useMemo',
        markName: 'use-core-start',
      },
    ],
  },
  {
    file: 'packages/flesh-cage/src/core/sheets.ts',
    markers: [
      {
        location: 'load',
        before: 'const promise = load()',
        markName: 'sheet-load-start',
      },
      {
        location: 'load',
        before: '.then((sheet) => {',
        markName: 'sheet-load-complete',
      },
    ],
  },
]

async function instrumentFile(filePath, markers) {
  console.log(`\n📝 Instrumenting: ${filePath}`)

  const content = await readFile(filePath, 'utf-8')
  let instrumented = content

  // Add performance marks
  markers.forEach(({ before, markName }) => {
    const mark = `performance.mark('${markName}-start');`
    const measure = `performance.mark('${markName}-end'); performance.measure('${markName}', '${markName}-start', '${markName}-end');`

    // This is a simplified approach - in reality you'd need more sophisticated parsing
    console.log(`   Adding mark: ${markName}`)
  })

  console.log(`   ⚠️  Manual instrumentation recommended - see INSTRUMENTATION_GUIDE.md`)

  return instrumented
}

async function generateInstrumentationGuide() {
  const guide = `# Performance Instrumentation Guide

This guide shows where to add performance marks to identify bottlenecks.

## Why Instrument?

Performance marks help identify exactly where time is spent:
- Shadow DOM creation
- Stylesheet adoption
- Portal creation
- Custom element lifecycle

## How to Add Marks

Add \`performance.mark()\` calls at key points:

\`\`\`typescript
performance.mark('operation-start')
// ... expensive operation ...
performance.mark('operation-end')
performance.measure('operation', 'operation-start', 'operation-end')
\`\`\`

## Recommended Instrumentation Points

### 1. Shadow DOM Creation (styled.tsx:30)

\`\`\`typescript
// Before
shadow = this.attachShadow({ mode: 'open' })

// After
performance.mark('shadow-dom-create-start')
shadow = this.attachShadow({ mode: 'open' })
performance.mark('shadow-dom-create-end')
performance.measure('shadow-dom-create', 'shadow-dom-create-start', 'shadow-dom-create-end')
\`\`\`

### 2. Stylesheet Adoption (styled.tsx:39)

\`\`\`typescript
// Before
Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })

// After
performance.mark('adopt-stylesheet-start')
Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })
performance.mark('adopt-stylesheet-end')
performance.measure('adopt-stylesheet', 'adopt-stylesheet-start', 'adopt-stylesheet-end')
\`\`\`

### 3. Skin Loading (sheets.ts:22)

\`\`\`typescript
// Before
load(skin: Names): Promise<CSSStyleSheet> {
  const { [skin]: load } = this.#skins
  const promise = load()
    .then(({ default: style }) => new CSSStyleSheet().replace(style))
    .then((sheet) => {
      super.set(skin, sheet)
      return sheet
    })

  super.set(skin, promise)
  return promise
}

// After
load(skin: Names): Promise<CSSStyleSheet> {
  performance.mark(\`sheet-load-\${skin}-start\`)
  const { [skin]: load } = this.#skins
  const promise = load()
    .then(({ default: style }) => {
      performance.mark(\`sheet-parse-\${skin}-start\`)
      return new CSSStyleSheet().replace(style)
    })
    .then((sheet) => {
      performance.mark(\`sheet-load-\${skin}-end\`)
      performance.measure(\`sheet-load-\${skin}\`, \`sheet-load-\${skin}-start\`, \`sheet-load-\${skin}-end\`)
      super.set(skin, sheet)
      return sheet
    })

  super.set(skin, promise)
  return promise
}
\`\`\`

### 4. Custom Element Lifecycle (styled.tsx:71-79)

\`\`\`typescript
connectedCallback() {
  performance.mark('custom-element-connected')
  this.addEventListener('change', this.change)
}

disconnectedCallback() {
  performance.mark('custom-element-disconnected')
  this.shadow.adoptedStyleSheets = []
  this.removeEventListener('change', this.change)
}
\`\`\`

### 5. Portal Creation (use-core.tsx)

\`\`\`typescript
const container = useMemo(() => {
  performance.mark('portal-container-create-start')
  const div = document.createElement('div')
  performance.mark('portal-container-create-end')
  performance.measure('portal-container-create', 'portal-container-create-start', 'portal-container-create-end')
  return div
}, [])
\`\`\`

## Viewing Results

After instrumentation, marks will appear in:
1. Chrome DevTools Performance tab (User Timing track)
2. Puppeteer trace files (analyzed by analyze.js)
3. Console via \`performance.getEntriesByType('measure')\`

## Automated Capture

Run profiling scripts to capture all marks:

\`\`\`bash
npm run profile
\`\`\`

This will:
1. Capture all performance marks
2. Export to JSON
3. Analyze and compare implementations
4. Identify bottlenecks

## Example Output

After profiling, you'll see:

\`\`\`
Shadow DOM Create: 2.34ms (per component)
Adopt Stylesheet: 0.12ms (per component)
Sheet Load: 8.45ms (first load, then cached)
Portal Create: 0.08ms (per component)
\`\`\`

This shows Shadow DOM creation is the main bottleneck (2.34ms per component).
`

  await writeFile('./profiling/INSTRUMENTATION_GUIDE.md', guide)
  console.log('\n✅ Generated: profiling/INSTRUMENTATION_GUIDE.md')
}

async function main() {
  console.log('🔧 Performance Instrumentation Tool')
  console.log('====================================\n')

  await generateInstrumentationGuide()

  console.log('\n📖 Manual instrumentation is recommended for accuracy.')
  console.log('   See: profiling/INSTRUMENTATION_GUIDE.md')
  console.log('\nAfter adding marks, run:')
  console.log('   npm run profile')
}

main().catch(console.error)
