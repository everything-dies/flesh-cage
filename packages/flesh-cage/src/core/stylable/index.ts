export const verify = (error: Error) =>
  error instanceof DOMException && error.name === 'AbortError'
    ? Promise.resolve(error)
    : Promise.reject(error)

export abstract class Stylable<
  Names extends string = string,
> extends HTMLElement {
  static observedAttributes = ['skin'] as const

  controller = new AbortController()

  shadow = this.attachShadow({ mode: 'open' })

  protected abstract validate(skin: Names): boolean

  protected abstract load(skin: Names): Promise<CSSStyleSheet> | CSSStyleSheet

  adorn = (skin: Names) => {
    const { controller: previous } = this
    const next = (this.controller = new AbortController())
    const invalid = !this.validate(skin)
    const adopt = (sheet: CSSStyleSheet) => {
      next.signal.throwIfAborted()

      return Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })
    }

    previous.abort()

    return new Promise<CSSStyleSheet>((resolve, reject) =>
      invalid ? reject(new Error('Invalid skin')) : resolve(this.load(skin))
    )
      .then(adopt)
      .catch(verify)
  }

  attributeChangedCallback(
    name: (typeof Stylable.observedAttributes)[number],
    _: string,
    skin: string
  ) {
    switch (true) {
      case name.trim().toLowerCase() === 'skin':
        return this.suspend(this.adorn(skin as Names))
    }
  }

  change = (event: Event) => {
    const { detail } = event as CustomEvent<{ skin?: Names }>
    const skin = (this.getAttribute('skin') ?? detail.skin ?? '')
      .trim()
      .toLowerCase() as Names

    return this.suspend(this.adorn(skin))
  }

  connectedCallback() {
    this.addEventListener('change', this.change)
  }

  disconnectedCallback() {
    this.shadow.adoptedStyleSheets = []

    this.removeEventListener('change', this.change)
  }

  resume = () => this.dispatchEvent(new CustomEvent('suspend'))

  suspend = (promise: Promise<unknown>) => {
    const detail = promise.finally(this.resume)
    const retrieve = () =>
      this.dispatchEvent(new CustomEvent('suspend', { detail }))

    return queueMicrotask(retrieve)
  }
}
