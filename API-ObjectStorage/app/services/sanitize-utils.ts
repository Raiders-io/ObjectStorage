export function sanitizeFilename(filename: string): string | undefined {
  // Keep only alphanumeric characters, underscores, hyphens, and dots in the filename
  console.log(`Sanitizing filename: ${filename}`)
  const sanitized = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  console.log(`Sanitized filename: ${sanitized}`)
  if (sanitized.length === 0 || sanitized === '.' || sanitized === '..')
    return undefined; // Return undefined if the sanitized filename is empty

  // Check if the file has a name before extension 
  const parts = sanitized.split('.');
  if (parts.length > 1 && parts[0].length === 0)
      return undefined;
  return sanitized;
}

export function sanitizeUserId(userId: string): string | undefined { return sanitizeFilename(userId); }
