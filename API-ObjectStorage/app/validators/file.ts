import vine from '@vinejs/vine'

/**
 * Validator for a single file
 */
export const fileSchema = vine.file({
  size: '5mb',
  extnames: ['txt', 'pdf', 'md', 'tex'],
})

/**
 * Validator to use before writing to DB a file
 */
export const FileValidator = vine.create({
  file: fileSchema,
})

/**
 * Validator to use before writing to DB multiple files
 */
export const FilesValidator = vine.create({
  files: vine.array(fileSchema).maxLength(10), // Max 10 files at once
})
export const MultipleFilesValidator = FilesValidator // Alias for better readability when validating multiple files

/**
 * Validator for search access-objects-controller
 */
export const searchFilesValidator = vine.create({
  files: vine.array(vine.string()).minLength(1),
})

/**
 * Validator for the optional search query ?q=
 * '*' is the only accepted wildcard, LIKE wildcards '%', '_' and the
 * escape character '\' are rejected
 */
export const searchQueryValidator = vine.create({
  q: vine
    .string()
    .trim()
    .maxLength(100)
    .regex(/^[^%_\\]*$/)
    .optional(),
})
