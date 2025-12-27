/**
 * @flesh-cage/vite-plugin
 *
 * Vite plugin for convention-based shadow components
 *
 * Features:
 * - Auto-discovers skin files based on naming conventions
 * - Zero boilerplate - just write components
 * - Auto-wires useSkinContext() internally
 * - Optional directives for customization
 */

import type { Plugin } from 'vite'
import type { ShadowComponentsOptions } from './types'

/**
 * Vite plugin for flesh-cage shadow components
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { shadowComponents } from '@flesh-cage/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     shadowComponents({
 *       include: 'src/components/**\/*.tsx',
 *       skinPattern: '*.skin.ts',
 *       variantPattern: '*.{variant}.ts',
 *     })
 *   ]
 * })
 * ```
 */
export function shadowComponents(options: ShadowComponentsOptions = {}): Plugin {
  const {
    include = 'src/components/**/*.{tsx,jsx}',
    exclude = ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    skinPattern = '*.skin.ts',
    variantPattern = '*.{variant}.ts',
    autoDetectSkins = true,
  } = options

  return {
    name: 'flesh-cage:shadow-components',

    enforce: 'pre',

    async transform(code: string, id: string) {
      // TODO: Implement plugin transformation logic
      // For now, this is a placeholder that will be implemented in a future iteration

      // The plugin will:
      // 1. Detect component files matching the include pattern
      // 2. Search for skin files using the conventions
      // 3. Parse directives from comments
      // 4. Transform the component to wrap it with createShadowComponent
      // 5. Auto-inject useSkinContext() call

      return null
    },
  }
}

export type { ShadowComponentsOptions } from './types'
