/**
 * Options for the shadowComponents Vite plugin
 */
export interface ShadowComponentsOptions {
  /**
   * Glob pattern(s) for component files to process
   * @default 'src/components/**\/*.{tsx,jsx}'
   */
  include?: string | string[]

  /**
   * Glob pattern(s) for files to exclude
   * @default ['**\/*.test.*', '**\/*.spec.*', '**\/*.stories.*']
   */
  exclude?: string | string[]

  /**
   * Pattern for default skin files
   * @default '*.skin.ts'
   */
  skinPattern?: string

  /**
   * Pattern for variant skin files
   * Use {variant} as placeholder for variant name
   * @default '*.{variant}.ts'
   */
  variantPattern?: string

  /**
   * Auto-detect skin files based on conventions
   * @default true
   */
  autoDetectSkins?: boolean

  /**
   * Custom element name prefix
   * @default undefined
   */
  elementPrefix?: string

  /**
   * Naming convention for custom elements
   * @default 'kebab-case'
   */
  elementNaming?: 'kebab-case' | 'snake_case'

  /**
   * Shadow DOM mode
   * @default 'open'
   */
  shadowMode?: 'open' | 'closed'

  /**
   * Auto-export parts from component
   * @default true
   */
  autoExportParts?: boolean

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}
