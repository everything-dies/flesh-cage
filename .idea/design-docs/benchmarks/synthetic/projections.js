/**
 * Synthetic Benchmark: Memory and Performance Projections
 *
 * This script models expected memory usage and performance based on
 * empirical data from browser benchmarks and theoretical analysis.
 */

// Empirical constants (from browser testing)
const CONSTANTS = {
  // Average CSSStyleSheet object size in bytes
  STYLESHEET_OVERHEAD: 2048, // ~2KB per CSSStyleSheet object overhead

  // Average CSS text size per component per skin
  CSS_TEXT_SIZE: {
    small: 1024, // 1KB - minimal component (button, input)
    medium: 3072, // 3KB - typical component (card, form)
    large: 8192, // 8KB - complex component (data grid, editor)
  },

  // Performance timings (ms)
  STYLE_TAG_INSERTION: 2.5, // Traditional: insert <style> in head
  STYLESHEET_ADOPTION: 0.3, // Constructable: adoptedStyleSheets assignment
  STYLESHEET_REPLACE: 0.8, // Constructable: first sheet.replace()
  STYLESHEET_REPLACE_CACHED: 0.1, // Constructable: using cached sheet

  // Memory overhead per component instance
  SHADOW_ROOT_OVERHEAD: 512, // Bytes per shadow root
  COMPONENT_INSTANCE_OVERHEAD: 1024, // Bytes per component instance (JS object)

  // Traditional CSS-in-JS overhead
  TRADITIONAL_STYLE_TAG_OVERHEAD: 256, // Bytes per <style> tag in shadow root
}

/**
 * Calculate memory usage for a given scenario
 */
function calculateMemory(scenario) {
  const {
    uniqueComponents,
    instancesPerComponent,
    skins,
    componentComplexity = 'medium',
    cacheStrategy = 'refCounting', // 'refCounting', 'eternal', 'none'
  } = scenario

  const totalInstances = uniqueComponents * instancesPerComponent
  const cssSize = CONSTANTS.CSS_TEXT_SIZE[componentComplexity]

  // Constructable Stylesheets approach
  let constructableMemory = {
    // Shared CSSStyleSheet objects (cached and reused)
    stylesheets: 0,
    // Shadow roots (one per instance)
    shadowRoots: totalInstances * CONSTANTS.SHADOW_ROOT_OVERHEAD,
    // Component instances
    instances: totalInstances * CONSTANTS.COMPONENT_INSTANCE_OVERHEAD,
    // Total
    total: 0,
  }

  if (cacheStrategy === 'refCounting' || cacheStrategy === 'eternal') {
    // Only count sheets for loaded skins
    // Assumption: All skins loaded across all components
    const uniqueSheets = uniqueComponents * skins.length
    constructableMemory.stylesheets =
      uniqueSheets * (CONSTANTS.STYLESHEET_OVERHEAD + cssSize)
  } else {
    // No caching: each instance has its own sheet (worst case)
    constructableMemory.stylesheets =
      totalInstances * (CONSTANTS.STYLESHEET_OVERHEAD + cssSize)
  }

  constructableMemory.total =
    constructableMemory.stylesheets +
    constructableMemory.shadowRoots +
    constructableMemory.instances

  // Traditional approach (style tags in shadow roots)
  let traditionalMemory = {
    // Each shadow root has its own <style> tag with CSS text
    styleTags:
      totalInstances * (CONSTANTS.TRADITIONAL_STYLE_TAG_OVERHEAD + cssSize),
    // Shadow roots
    shadowRoots: totalInstances * CONSTANTS.SHADOW_ROOT_OVERHEAD,
    // Component instances
    instances: totalInstances * CONSTANTS.COMPONENT_INSTANCE_OVERHEAD,
    // Total
    total: 0,
  }

  traditionalMemory.total =
    traditionalMemory.styleTags +
    traditionalMemory.shadowRoots +
    traditionalMemory.instances

  return {
    constructable: constructableMemory,
    traditional: traditionalMemory,
    savings: traditionalMemory.total - constructableMemory.total,
    savingsPercent: (
      ((traditionalMemory.total - constructableMemory.total) /
        traditionalMemory.total) *
      100
    ).toFixed(1),
  }
}

/**
 * Calculate performance for a given scenario
 */
function calculatePerformance(scenario) {
  const {
    uniqueComponents,
    instancesPerComponent,
    skins,
    cacheStrategy = 'refCounting',
  } = scenario

  const totalInstances = uniqueComponents * instancesPerComponent

  // Mount performance
  let constructableMountTime = 0
  let traditionalMountTime = 0

  if (cacheStrategy === 'eternal' || cacheStrategy === 'refCounting') {
    // First mount: create sheets
    const firstMountPerComponent =
      CONSTANTS.STYLESHEET_REPLACE + CONSTANTS.STYLESHEET_ADOPTION
    // Subsequent mounts: use cached sheets
    const cachedMountPerComponent =
      CONSTANTS.STYLESHEET_REPLACE_CACHED + CONSTANTS.STYLESHEET_ADOPTION

    constructableMountTime =
      uniqueComponents * firstMountPerComponent +
      (totalInstances - uniqueComponents) * cachedMountPerComponent
  } else {
    // No caching: every instance creates new sheet
    constructableMountTime =
      totalInstances *
      (CONSTANTS.STYLESHEET_REPLACE + CONSTANTS.STYLESHEET_ADOPTION)
  }

  // Traditional: every instance inserts style tag
  traditionalMountTime = totalInstances * CONSTANTS.STYLE_TAG_INSERTION

  // Theme switch performance
  const constructableSwitchTime = totalInstances * CONSTANTS.STYLESHEET_ADOPTION
  const traditionalSwitchTime = totalInstances * CONSTANTS.STYLE_TAG_INSERTION

  return {
    mount: {
      constructable: constructableMountTime,
      traditional: traditionalMountTime,
      speedup: (traditionalMountTime / constructableMountTime).toFixed(2),
    },
    themeSwitch: {
      constructable: constructableSwitchTime,
      traditional: traditionalSwitchTime,
      speedup: (traditionalSwitchTime / constructableSwitchTime).toFixed(2),
    },
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/**
 * Print results for a scenario
 */
function printScenario(name, scenario) {
  console.log('\n' + '='.repeat(80))
  console.log(`SCENARIO: ${name}`)
  console.log('='.repeat(80))
  console.log(`\nConfiguration:`)
  console.log(`  Unique Components: ${scenario.uniqueComponents}`)
  console.log(`  Instances per Component: ${scenario.instancesPerComponent}`)
  console.log(
    `  Total Instances: ${scenario.uniqueComponents * scenario.instancesPerComponent}`
  )
  console.log(`  Skins/Themes: ${scenario.skins.length}`)
  console.log(`  Component Complexity: ${scenario.componentComplexity}`)
  console.log(`  Cache Strategy: ${scenario.cacheStrategy}`)

  const memory = calculateMemory(scenario)
  console.log(`\nMemory Usage:`)
  console.log(`  Constructable Stylesheets:`)
  console.log(
    `    Stylesheets:  ${formatBytes(memory.constructable.stylesheets)}`
  )
  console.log(
    `    Shadow Roots: ${formatBytes(memory.constructable.shadowRoots)}`
  )
  console.log(
    `    Instances:    ${formatBytes(memory.constructable.instances)}`
  )
  console.log(`    TOTAL:        ${formatBytes(memory.constructable.total)}`)
  console.log(`\n  Traditional (Style Tags):`)
  console.log(`    Style Tags:   ${formatBytes(memory.traditional.styleTags)}`)
  console.log(
    `    Shadow Roots: ${formatBytes(memory.traditional.shadowRoots)}`
  )
  console.log(`    Instances:    ${formatBytes(memory.traditional.instances)}`)
  console.log(`    TOTAL:        ${formatBytes(memory.traditional.total)}`)
  console.log(
    `\n  Savings: ${formatBytes(memory.savings)} (${memory.savingsPercent}% reduction)`
  )

  const performance = calculatePerformance(scenario)
  console.log(`\nPerformance:`)
  console.log(`  Initial Mount:`)
  console.log(
    `    Constructable: ${performance.mount.constructable.toFixed(2)}ms`
  )
  console.log(
    `    Traditional:   ${performance.mount.traditional.toFixed(2)}ms`
  )
  console.log(`    Speedup:       ${performance.mount.speedup}x faster`)
  console.log(`\n  Theme Switch:`)
  console.log(
    `    Constructable: ${performance.themeSwitch.constructable.toFixed(2)}ms`
  )
  console.log(
    `    Traditional:   ${performance.themeSwitch.traditional.toFixed(2)}ms`
  )
  console.log(`    Speedup:       ${performance.themeSwitch.speedup}x faster`)
}

// Define scenarios
const scenarios = {
  'Small App (Typical SPA)': {
    uniqueComponents: 20,
    instancesPerComponent: 5,
    skins: ['light', 'dark', 'highContrast'],
    componentComplexity: 'medium',
    cacheStrategy: 'refCounting',
  },

  'Medium App (Dashboard)': {
    uniqueComponents: 50,
    instancesPerComponent: 8,
    skins: ['light', 'dark', 'blue', 'green', 'highContrast'],
    componentComplexity: 'medium',
    cacheStrategy: 'refCounting',
  },

  'Large App (Enterprise Design System)': {
    uniqueComponents: 100,
    instancesPerComponent: 20,
    skins: [
      'light',
      'dark',
      'brand1',
      'brand2',
      'brand3',
      'brand4',
      'brand5',
      'brand6',
      'brand7',
      'brand8',
    ],
    componentComplexity: 'large',
    cacheStrategy: 'refCounting',
  },

  'Extreme (Microfrontends)': {
    uniqueComponents: 500,
    instancesPerComponent: 20,
    skins: Array.from({ length: 20 }, (_, i) => `theme${i + 1}`),
    componentComplexity: 'medium',
    cacheStrategy: 'refCounting',
  },

  'Worst Case (No Caching)': {
    uniqueComponents: 100,
    instancesPerComponent: 10,
    skins: ['light', 'dark', 'highContrast'],
    componentComplexity: 'large',
    cacheStrategy: 'none',
  },
}

// Run all scenarios
console.log('\n')
console.log('╔' + '═'.repeat(78) + '╗')
console.log(
  '║' +
    ' '.repeat(20) +
    'CONSTRUCTABLE STYLESHEETS PROJECTIONS' +
    ' '.repeat(21) +
    '║'
)
console.log('╚' + '═'.repeat(78) + '╝')

Object.entries(scenarios).forEach(([name, scenario]) => {
  printScenario(name, scenario)
})

// Summary comparison
console.log('\n' + '='.repeat(80))
console.log('SUMMARY COMPARISON')
console.log('='.repeat(80))
console.log(
  '\n| Scenario | Components | Memory Savings | Mount Speedup | Switch Speedup |'
)
console.log(
  '|----------|------------|----------------|---------------|----------------|'
)

Object.entries(scenarios).forEach(([name, scenario]) => {
  const memory = calculateMemory(scenario)
  const performance = calculatePerformance(scenario)
  const totalInstances =
    scenario.uniqueComponents * scenario.instancesPerComponent

  console.log(
    `| ${name.padEnd(35)} | ` +
      `${totalInstances.toString().padEnd(10)} | ` +
      `${memory.savingsPercent}%`.padEnd(14) +
      ' | ' +
      `${performance.mount.speedup}x`.padEnd(13) +
      ' | ' +
      `${performance.themeSwitch.speedup}x`.padEnd(14) +
      ' |'
  )
})

console.log('\n')

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateMemory,
    calculatePerformance,
    formatBytes,
    CONSTANTS,
  }
}
