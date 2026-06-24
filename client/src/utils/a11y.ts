export function getAriaInvalid(error: unknown): 'true' | undefined {
  return error ? 'true' : undefined
}
