import type { ReactNode, ComponentType } from 'react'
import type { Skins } from '../core'

/**
 * Configuration for createShadowComponent
 */
export interface CreateShadowComponentConfig<Props = unknown, SkinNames extends string = string> {
  /**
   * Name of the custom element (must contain hyphen)
   */
  name: string

  /**
   * Map of skin names to loaders
   */
  skins: Skins<SkinNames>

  /**
   * Default skin to use if none specified in context
   */
  defaultSkin?: SkinNames

  /**
   * Parts to export via exportparts
   */
  parts?: string[]

  /**
   * Shadow DOM mode
   * @default 'open'
   */
  mode?: ShadowRootMode

  /**
   * Render function for the component content
   */
  render: ComponentType<Props>
}

/**
 * Configuration for withShadowStyles HOC
 */
export interface WithShadowStylesConfig<SkinNames extends string = string> {
  /**
   * Name of the custom element (must contain hyphen)
   */
  name: string

  /**
   * Map of skin names to loaders
   */
  skins: Skins<SkinNames>

  /**
   * Default skin to use if none specified in context
   */
  defaultSkin?: SkinNames

  /**
   * Parts to export via exportparts
   */
  parts?: string[]

  /**
   * Shadow DOM mode
   * @default 'open'
   */
  mode?: ShadowRootMode
}

/**
 * Props for ShadowRoot component
 */
export interface ShadowRootProps<SkinNames extends string = string> {
  /**
   * Name of the custom element
   */
  name: string

  /**
   * Map of skin names to loaders
   */
  skins: Skins<SkinNames>

  /**
   * Override skin from context
   */
  skin?: SkinNames

  /**
   * Parts to export
   */
  parts?: string[]

  /**
   * Shadow DOM mode
   * @default 'open'
   */
  mode?: ShadowRootMode

  /**
   * Children to render in shadow root
   */
  children: ReactNode
}
