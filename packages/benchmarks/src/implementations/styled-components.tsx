import styled from 'styled-components'
import { createTree } from '../cases/Tree'
import { createSierpinskiTriangle } from '../cases/SierpinskiTriangle'

// Box component for Tree benchmark
const Box = styled.div<{
  $color: string
  $layout: 'column' | 'row'
  $outer: boolean
}>`
  display: flex;
  flex-direction: ${(props) => (props.$layout === 'column' ? 'column' : 'row')};
  padding: ${(props) => (props.$outer ? '10px' : '0')};
  margin: ${(props) => (props.$outer ? '5px' : '0')};
  background-color: ${(props) => props.$color};
  color: ${(props) => (props.$color === 'black' ? 'white' : 'inherit')};
`

// Box wrapper
function BoxWrapper({
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
    <Box $color={color} $layout={layout} $outer={outer}>
      {children}
    </Box>
  )
}

// Dot component for SierpinskiTriangle benchmark
const Dot = styled.div<{
  $color: string
  $size: number
  $x: number
  $y: number
}>`
  position: absolute;
  font-size: 10px;
  cursor: pointer;
  text-align: center;
  line-height: 1;
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  left: ${(props) => props.$x}px;
  top: ${(props) => props.$y}px;
  background-color: ${(props) => props.$color};
  border-radius: 50%;
`

// Dot wrapper
function DotWrapper({
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
    <Dot $color={color} $size={size} $x={x} $y={y}>
      {children}
    </Dot>
  )
}

// Create the benchmark components
const Tree = createTree(BoxWrapper)
const SierpinskiTriangle = createSierpinskiTriangle(DotWrapper)

export const StyledComponentsImplementation = {
  name: 'styled-components',
  version: '6.1.x',
  Box: BoxWrapper,
  Dot: DotWrapper,
  Tree,
  SierpinskiTriangle,
}
