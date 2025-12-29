import type { FC } from 'react'

import type { ProviderProps } from './types'
import { Context } from './context'

export const Provider: FC<ProviderProps> = ({ skin, children }) => {
  return <Context.Provider value={skin}>{children}</Context.Provider>
}
