// Type augmentations for browser APIs not yet in TypeScript DOM types

interface Performance {
  measureUserAgentSpecificMemory?: () => Promise<{
    bytes: number
    breakdown: Array<{
      bytes: number
      types: string[]
    }>
  }>
}
