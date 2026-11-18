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

/**
 * Validator for bulk delete: the list of file ids (names) to delete
 */
export const destroyFilesValidator = vine.create({
  ids: vine.array(vine.string().minLength(1)).minLength(1),
})

/**
 * Validator to partially update an object info (PATCH /:id)
 * 'visibility' is optional and defaults to 'private' in the controller
 */
export const updateInfoValidator = vine.create({
  visibility: vine.enum(['public', 'private', 'shared']).optional(),
})
