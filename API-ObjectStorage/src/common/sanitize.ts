export function sanitizeFilename(filename: string): string | undefined {
  const sanitized = filename.replace(/[^a-zA-Z0-9_\-.]/g, '')
  if (sanitized.length === 0 || sanitized === '.' || sanitized === '..') return undefined
  const parts = sanitized.split('.')
  if (parts.length > 1 && parts[0].length === 0) return undefined
  return sanitized
}

export function sanitizeUserId(userId: string): string | undefined {
  return sanitizeFilename(userId)
}

export function calculatePrefix(userId: string, filename?: string): string {
  return filename === undefined ? `files/${userId}/` : `files/${userId}/${filename}`
}
