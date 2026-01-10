import type { Skins } from '../types'

export class Sheets<Names extends string = string> extends Map<
  Names,
  CSSStyleSheet | Promise<CSSStyleSheet>
> {
  #skins: Skins<Names>

  constructor({ skins }: { skins: Skins<Names> }) {
    super()
    this.#skins = skins
  }

  validate(skin?: string): skin is Names {
    return !!skin && Object.prototype.hasOwnProperty.call(this.#skins, skin)
  }

  override get(skin: Names): CSSStyleSheet | Promise<CSSStyleSheet> {
    return super.get(skin) || this.load(skin)
  }

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
}
