import { useContext as useGenericContext } from 'react'

import { Context } from '../context'

export const useContext = () => useGenericContext(Context)
