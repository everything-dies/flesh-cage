import { styled, Provider } from '@everything-dies/flesh-cage'
import { BenchmarkType, createTree } from '../cases/Tree'
import { createSierpinskiTriangle } from '../cases/SierpinskiTriangle'

const BOX_STYLE_MAP: Record<string, React.CSSProperties> = {
  'column-false': {
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    margin: '0',
  },
  'column-true': {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    margin: '5px',
  },
  'row-false': {
    display: 'flex',
    flexDirection: 'row',
    padding: '0',
    margin: '0',
  },
  'row-true': {
    display: 'flex',
    flexDirection: 'row',
    padding: '10px',
    margin: '5px',
  },
}

const SKIN_BOX_STYLE: React.CSSProperties = {
  width: '40px',
  height: '40px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
}

const DOT_STYLE_CACHE = new Map<string, React.CSSProperties>()

const getDotStyle = (size: number, x: number, y: number, color: string) => {
  const key = `${String(size)}-${String(x)}-${String(y)}`
  let style = DOT_STYLE_CACHE.get(key)

  if (!style) {
    style = {
      width: `${String(size)}px`,
      height: `${String(size)}px`,
      left: `${String(x)}px`,
      top: `${String(y)}px`,
      borderRadius: '50%',
      backgroundColor: color,
    }
    DOT_STYLE_CACHE.set(key, style)
  } else {
    style.backgroundColor = color
  }

  return style
}

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
      <Box style={BOX_STYLE_MAP[`${layout}-${String(outer)}`]}>{children}</Box>
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

const SkinBox = styled('div', {
  name: 'bench-skin-box',
  skins: {
    red: () =>
      Promise.resolve({
        default: `
        div { background-color: #f44336; color: white; }
      `,
      }),
    blue: () =>
      Promise.resolve({
        default: `
        div { background-color: #2196f3; color: white; }
      `,
      }),
  },
})

const BoxAttribute = styled('div', {
  name: 'bench-box-attr',
  skins: {
    base: () =>
      Promise.resolve({
        default: `
        div[data-color="black"] { background-color: black; color: white; }
        div[data-color="red"] { background-color: #f44336; }
        div[data-color="blue"] { background-color: #2196f3; }
        div[data-color="transparent"] { background-color: transparent; }
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
      <Dot style={getDotStyle(size, x, y, color)}>{children}</Dot>
    </Provider>
  )
}

function BoxWithAttributes({
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
    <BoxAttribute
      data-color={color}
      style={BOX_STYLE_MAP[`${layout}-${String(outer)}`]}
    >
      {children}
    </BoxAttribute>
  )
}

function SkinSwitch({ renderCount }: { renderCount: number }) {
  const skin = renderCount % 2 === 0 ? 'red' : 'blue'

  return (
    <Provider skin={skin}>
      <SkinBox style={SKIN_BOX_STYLE}>{skin}</SkinBox>
    </Provider>
  )
}

SkinSwitch.benchmarkType = BenchmarkType.UPDATE

// Create the benchmark components
const Tree = createTree(BoxWithSkin)
const SierpinskiTriangle = createSierpinskiTriangle(DotWithColor)
const TreeAttribute = createTree(BoxWithAttributes)

function TreeSingleProvider(props: Parameters<typeof TreeAttribute>[0]) {
  return (
    <Provider skin="base">
      <TreeAttribute {...props} />
    </Provider>
  )
}

export const FleshCageImplementation = {
  name: 'flesh-cage',
  version: '0.1.0',
  Provider,
  Box: BoxWithSkin,
  Dot: DotWithColor,
  Tree,
  SierpinskiTriangle,
  SkinSwitch,
  TreeSingle: TreeSingleProvider,
}
