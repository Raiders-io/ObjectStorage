export function sanitizeFilename(filename: string): string | undefined {
  // Keep only alphanumeric characters, underscores, hyphens, and dots in the filename
  const sanitized = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '')
  if (sanitized.length === 0 || sanitized === '.' || sanitized === '..') return undefined // Return undefined if the sanitized filename is empty

  // Check if the file has a name before extension
  const parts = sanitized.split('.')
  if (parts.length > 1 && parts[0].length === 0) return undefined
  return sanitized
}

export function sanitizeUserId(userId: string): string | undefined {
  return sanitizeFilename(userId)
}

/**
 * Converts a user search term into an ILIKE pattern.
 * '*' is the only accepted wildcard and becomes '%',
 * every other wildcard or escape character is escaped literally
 */
export function searchToIlikePattern(search: string): string {
  return search.replace(/[\\%_]/g, '\\$&').replace(/\*/g, '%')
}
