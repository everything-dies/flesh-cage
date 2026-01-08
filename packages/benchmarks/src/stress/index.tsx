import React from 'react'
import { createRoot } from 'react-dom/client'
import { StressRunner } from './StressRunner'

const root = document.getElementById('root')

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <StressRunner />
    </React.StrictMode>
  )
}
