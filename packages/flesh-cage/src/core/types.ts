/**
 * Type definitions for @everything-dies/flesh-cage/core
 */

import type { HTMLAttributes, ReactNode } from 'react'

export interface StyledConfig<Names extends string = string> extends Partial<
  HTMLAttributes<HTMLElement>
> {
  name: string
  skins: Skins<Names>
  suspendable?: boolean
}

/**
 * A function that lazy-loads a skin CSS string
 */
export type SkinLoader = () => Promise<{ default: string }>

/**
 * Map of skin names to their loaders
 */
export type Skins<T extends string = string> = Record<T, SkinLoader>

/**
 * Props for Provider component
 */
export interface ProviderProps {
  /**
   * The skin to apply to all descendant components
   */
  skin: string

  /**
   * Children components
   */
  children: ReactNode
}
