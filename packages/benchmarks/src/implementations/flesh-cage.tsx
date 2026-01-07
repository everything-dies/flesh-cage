import { styled, Provider } from '@everything-dies/flesh-cage'
import { createTree } from '../cases/Tree'
import { createSierpinskiTriangle } from '../cases/SierpinskiTriangle'

// Box component for Tree benchmark
const Box = styled('div', {
  name: 'bench-box',
  skins: {
    black: () =>
      Promise.resolve({
        default: `
        div { background-color: black; color: white; }
      `,
      }),
    red: () =>
      Promise.resolve({
        default: `
        div { background-color: #f44336; }
      `,
      }),
    blue: () =>
      Promise.resolve({
        default: `
        div { background-color: #2196f3; }
      `,
      }),
    transparent: () =>
      Promise.resolve({
        default: `
        div { background-color: transparent; }
      `,
      }),
  },
})

// Box wrapper with skin logic
function BoxWithSkin({
  color,
  layout,
  outer,
  children,
}: {
  color: string
  layout: 'column' | 'row'
  outer: boolean
  children?: React.ReactNode
}) {
  return (
    <Provider skin={color as 'black' | 'red' | 'blue' | 'transparent'}>
      <Box
        style={{
          display: 'flex',
          flexDirection: layout === 'column' ? 'column' : 'row',
          padding: outer ? '10px' : '0',
          margin: outer ? '5px' : '0',
        }}
      >
        {children}
      </Box>
    </Provider>
  )
}

// Dot component for SierpinskiTriangle benchmark
const Dot = styled('div', {
  name: 'bench-dot',
  skins: {
    dynamic: () =>
      Promise.resolve({
        default: `
        div {
          position: absolute;
          font-size: 10px;
          cursor: pointer;
          text-align: center;
          line-height: 1;
        }
      `,
      }),
  },
})

// Dot wrapper with dynamic color
function DotWithColor({
  color,
  size,
  x,
  y,
  children,
}: {
  color: string
  size: number
  x: number
  y: number
  children: React.ReactNode
}) {
  return (
    <Provider skin="dynamic">
      <Dot
        style={{
          width: `${String(size)}px`,
          height: `${String(size)}px`,
          left: `${String(x)}px`,
          top: `${String(y)}px`,
          backgroundColor: color,
          borderRadius: '50%',
        }}
      >
        {children}
      </Dot>
    </Provider>
  )
}

// Create the benchmark components
const Tree = createTree(BoxWithSkin)
const SierpinskiTriangle = createSierpinskiTriangle(DotWithColor)

export const FleshCageImplementation = {
  name: 'flesh-cage',
  version: '0.1.0',
  Provider,
  Box: BoxWithSkin,
  Dot: DotWithColor,
  Tree,
  SierpinskiTriangle,
}
