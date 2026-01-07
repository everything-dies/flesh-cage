import type { ComponentType } from 'react'

export const BenchmarkType = {
  MOUNT: 'mount' as const,
  UPDATE: 'update' as const,
}

export type TreeProps = {
  breadth: number
  depth: number
  id: number
  wrap: number
}

type BoxComponent = ComponentType<{
  color: string
  layout: 'column' | 'row'
  outer: boolean
  children?: React.ReactNode
}>

/**
 * Tree benchmark - adapted from styled-components
 * Tests mounting performance with deep/wide component hierarchies
 *
 * For flesh-cage, this tests:
 * - Custom element creation overhead
 * - Shadow DOM creation performance
 * - adoptedStyleSheets initialization
 */
export function createTree(Box: BoxComponent) {
  function Tree({ breadth, depth, id, wrap }: TreeProps) {
    let result

    if (depth === 0) {
      result = (
        <Box color="black" layout="column" outer={false}>
          {id}
        </Box>
      )
    } else {
      const children = []
      for (let i = 0; i < breadth; i++) {
        children.push(
          <Tree breadth={breadth} depth={depth - 1} id={id} key={i} wrap={0} />
        )
      }
      result = (
        <Box
          color={depth % 2 === 0 ? 'red' : 'blue'}
          layout={depth % 2 === 0 ? 'column' : 'row'}
          outer={false}
        >
          {children}
        </Box>
      )
    }

    for (let i = 0; i < wrap; i++) {
      result = (
        <Box color="transparent" layout="row" outer>
          {result}
        </Box>
      )
    }

    return result
  }

  Tree.benchmarkType = BenchmarkType.MOUNT

  return Tree
}
