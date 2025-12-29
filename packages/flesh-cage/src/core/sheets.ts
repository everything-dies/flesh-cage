import type { SkinMap } from './types'

export class Sheets<T extends string = string> extends Map<
  T,
  CSSStyleSheet | Promise<CSSStyleSheet>
> {
  #skins: SkinMap<T>

  constructor({ skins }: { skins: SkinMap<T> }) {
    super()
    this.#skins = skins
  }

  validate(skin?: string): skin is T {
    return !!skin && Object.prototype.hasOwnProperty.call(this.#skins, skin)
  }

  override get(skin: T): CSSStyleSheet | Promise<CSSStyleSheet> {
    return super.get(skin) || this.load(skin)
  }

  load(skin: T): Promise<CSSStyleSheet> {
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
}
