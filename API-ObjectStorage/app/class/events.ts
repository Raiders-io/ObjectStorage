import { z } from 'zod'

export const ObjectStartedEvent = z.object({
  type: z.literal('object.started'),
  payload: z.object({
    message: z.string(),
  }),
})
export type ObjectStartedEvent = z.infer<typeof ObjectStartedEvent>

export const ObjectFileCreatedEvent = z.object({
  type: z.literal('object.file.created'),
  payload: z.object({
    userId: z.string(),
    filename: z.string(),
  }),
})
export type ObjectFileCreatedEvent = z.infer<typeof ObjectFileCreatedEvent>

export const ObjectFileUpdatedEvent = z.object({
  type: z.literal('object.file.updated'),
  payload: z.object({
    userId: z.string(),
    filename: z.string(),
  }),
})
export type ObjectFileUpdatedEvent = z.infer<typeof ObjectFileUpdatedEvent>

export const ObjectFileDeletedEvent = z.object({
  type: z.literal('object.file.deleted'),
  payload: z.object({
    userId: z.string(),
    filename: z.string(),
  }),
})
export type ObjectFileDeletedEvent = z.infer<typeof ObjectFileDeletedEvent>

export const ObjectFileVisibilityUpdatedEvent = z.object({
  type: z.literal('object.file.visibility.updated'),
  payload: z.object({
    userId: z.string(),
    filename: z.string(),
    visibility: z.enum(['public', 'private', 'shared']),
  }),
})
export type ObjectFileVisibilityUpdatedEvent = z.infer<typeof ObjectFileVisibilityUpdatedEvent>

export const ObjectUserDataEvent = z.object({
  type: z.literal('object.user.data'),
  payload: z.object({
    userId: z.string(),
    state: z.enum(['deleted', 'requested']),
  }),
})
export type ObjectUserDataEvent = z.infer<typeof ObjectUserDataEvent>

// ---------------------------------------------------------------------//
// Other events can be added here as needed, following the same pattern.
// ---------------------------------------------------------------------//
export const AuthUserDeletedEvent = z.object({
  type: z.literal('auth.user.deleted'),
  payload: z.object({
    userId: z.string(),
  }),
})
export type AuthUserDeletedEvent = z.infer<typeof AuthUserDeletedEvent>

export const LessonFileAttachedEvent = z.object({
  type: z.literal('lesson.file.attached'),
  payload: z.object({
    lessonId: z.string(),
    filename: z.string(),
    authorId: z.string(),
  }),
})
export type LessonFileAttachedEvent = z.infer<typeof LessonFileAttachedEvent>
