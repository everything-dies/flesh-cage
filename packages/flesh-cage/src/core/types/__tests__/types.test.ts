/* eslint-disable @typescript-eslint/no-deprecated */
import { describe, it, expectTypeOf } from 'vitest'
import type { StyledConfig, SkinLoader, Skins, ProviderProps } from '../index'

describe('Core Types', () => {
  describe('SkinLoader', () => {
    it('should accept a function returning Promise<{ default: string }>', () => {
      const loader: SkinLoader = () => Promise.resolve({ default: 'css' })
      expectTypeOf(loader).toMatchTypeOf<SkinLoader>()
    })

    it('should match the signature of dynamic imports with ?inline', () => {
      // Simulates: import('./styles.css?inline')
      const loader: SkinLoader = () =>
        Promise.resolve({ default: '.class { color: red; }' })
      expectTypeOf(loader).toMatchTypeOf<SkinLoader>()
    })

    it('should be callable without arguments', () => {
      const loader: SkinLoader = () => Promise.resolve({ default: '' })
      expectTypeOf(loader()).toEqualTypeOf<Promise<{ default: string }>>()
    })
  })

  describe('Skins', () => {
    it('should accept a record of skin names to loaders', () => {
      const skins: Skins = {
        dark: () => Promise.resolve({ default: 'dark css' }),
        light: () => Promise.resolve({ default: 'light css' }),
      }
      expectTypeOf(skins).toMatchTypeOf<Skins>()
    })

    it('should support literal type unions for skin names', () => {
      type MySkins = Skins<'primary' | 'secondary'>
      const skins: MySkins = {
        primary: () => Promise.resolve({ default: 'primary css' }),
        secondary: () => Promise.resolve({ default: 'secondary css' }),
      }
      expectTypeOf(skins).toMatchTypeOf<MySkins>()
    })

    it('should allow any string keys by default', () => {
      const skins: Skins = {
        'any-name': () => Promise.resolve({ default: '' }),
        'another-name': () => Promise.resolve({ default: '' }),
      }
      expectTypeOf(skins).toMatchTypeOf<Skins>()
    })
  })

  describe('StyledConfig', () => {
    it('should require name and skins properties', () => {
      const config: StyledConfig = {
        name: 'my-component',
        skins: {
          default: () => Promise.resolve({ default: '' }),
        },
      }
      expectTypeOf(config).toMatchTypeOf<StyledConfig>()
    })

    it('should accept optional suspendable flag', () => {
      const config: StyledConfig = {
        name: 'my-component',
        skins: {},
        suspendable: true,
      }
      expectTypeOf(config.suspendable).toEqualTypeOf<boolean | undefined>()
    })

    it('should inherit HTML attributes from Partial<HTMLAttributes>', () => {
      const config: StyledConfig = {
        name: 'my-component',
        skins: {},
        id: 'test-id',
        className: 'test-class',
        role: 'button',
        'aria-label': 'Test',
      }
      expectTypeOf(config).toMatchTypeOf<StyledConfig>()
    })

    it('should allow arbitrary attributes via index signature', () => {
      const config: StyledConfig = {
        name: 'my-component',
        skins: {},
        'data-testid': 'component',
        'data-custom': 123,
        customProp: { nested: 'value' },
      }
      expectTypeOf(config).toMatchTypeOf<StyledConfig>()
    })

    it('should support generic skin name constraints', () => {
      type MyConfig = StyledConfig<'dark' | 'light'>
      const config: MyConfig = {
        name: 'themed-component',
        skins: {
          dark: () => Promise.resolve({ default: 'dark' }),
          light: () => Promise.resolve({ default: 'light' }),
        },
      }
      expectTypeOf(config).toMatchTypeOf<MyConfig>()
    })

    it('should enforce name as required string', () => {
      const config: StyledConfig = {
        name: 'valid-name',
        skins: {},
      }
      expectTypeOf(config.name).toEqualTypeOf<string>()
    })

    it('should enforce skins as required Skins object', () => {
      const config: StyledConfig = {
        name: 'test',
        skins: {
          skin1: () => Promise.resolve({ default: '' }),
        },
      }
      expectTypeOf(config.skins).toMatchTypeOf<Skins>()
    })
  })

  describe('ProviderProps', () => {
    it('should require skin and children properties', () => {
      const props: ProviderProps = {
        skin: 'dark',
        children: null,
      }
      expectTypeOf(props).toMatchTypeOf<ProviderProps>()
    })

    it('should accept any ReactNode as children', () => {
      const props: ProviderProps = {
        skin: 'light',
        children: 'string child',
      }
      expectTypeOf(props.children).toMatchTypeOf<React.ReactNode>()
    })

    it('should enforce skin as required string', () => {
      const props: ProviderProps = {
        skin: 'theme-name',
        children: null,
      }
      expectTypeOf(props.skin).toEqualTypeOf<string>()
    })
  })
})
