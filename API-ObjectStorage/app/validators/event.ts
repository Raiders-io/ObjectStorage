import vine from '@vinejs/vine'
import { InferInput } from '@vinejs/vine/types'

export const ObjectStartedEvent = vine.create({
  type: vine.literal('object.started'),
  payload: vine.object({
    message: vine.string().minLength(1),
  }),
})
export type ObjectStartedEvent = InferInput<typeof ObjectStartedEvent>

export const ObjectFileCreatedEvent = vine.create({
  type: vine.literal('object.file.created'),
  payload: vine.object({
    userId: vine.string().uuid({ version: [4] }),
    filename: vine.string().minLength(1),
  }),
})
export type ObjectFileCreatedEvent = InferInput<typeof ObjectFileCreatedEvent>

export const ObjectFileUpdatedEvent = vine.create({
  type: vine.literal('object.file.updated'),
  payload: vine.object({
    userId: vine.string().uuid({ version: [4] }),
    filename: vine.string().minLength(1),
  }),
})
export type ObjectFileUpdatedEvent = InferInput<typeof ObjectFileUpdatedEvent>

export const ObjectFileDeletedEvent = vine.create({
  type: vine.literal('object.file.deleted'),
  payload: vine.object({
    userId: vine.string().uuid({ version: [4] }),
    filename: vine.string().minLength(1),
  }),
})
export type ObjectFileDeletedEvent = InferInput<typeof ObjectFileDeletedEvent>

export const ObjectFileVisibilityUpdatedEvent = vine.create({
  type: vine.literal('object.file.visibility.updated'),
  payload: vine.object({
    userId: vine.string().uuid({ version: [4] }),
    filename: vine.string().minLength(1),
    visibility: vine.enum(['public', 'private', 'shared']),
  }),
})
export type ObjectFileVisibilityUpdatedEvent = InferInput<typeof ObjectFileVisibilityUpdatedEvent>

export const ObjectUserDataEvent = vine.create({
  type: vine.literal('object.user.data'),
  payload: vine.object({
    userId: vine.string().uuid({ version: [4] }),
    state: vine.enum(['deleted', 'requested']),
  }),
})
export type ObjectUserDataEvent = InferInput<typeof ObjectUserDataEvent>

// ---------------------------------------------------------------------//
// Other events can be added here as needed, following the same pattern.
// ---------------------------------------------------------------------//
export const AuthUserDeletedEvent = vine.create({
  type: vine.literal('auth.user.deleted'),
  payload: vine.object({
    userId: vine.string().uuid({ version: [4] }),
  }),
})
export type AuthUserDeletedEvent = InferInput<typeof AuthUserDeletedEvent>

export const LessonFileAttachedEvent = vine.create({
  type: vine.literal('lesson.file.attached'),
  payload: vine.object({
    lessonId: vine.string().minLength(1),
    filename: vine.unionOfTypes([
      vine.string().minLength(1),
      vine.array(vine.string()).minLength(1),
    ]),
    authorId: vine.string().minLength(1),
  }),
})
export type LessonFileAttachedEvent = InferInput<typeof LessonFileAttachedEvent>
