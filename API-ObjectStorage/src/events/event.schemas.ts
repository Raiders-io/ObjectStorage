import { z } from 'zod'

const uuidV4 = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid UUID v4')

const filePayload = z.object({ userId: uuidV4, filename: z.string().min(1) })

export const ObjectStartedEventSchema = z.object({
  type: z.literal('object.started'),
  payload: z.object({ message: z.string().min(1) }),
})
export const ObjectFileCreatedEventSchema = z.object({
  type: z.literal('object.file.created'),
  payload: filePayload,
})
export const ObjectFileUpdatedEventSchema = z.object({
  type: z.literal('object.file.updated'),
  payload: filePayload,
})
export const ObjectFileDeletedEventSchema = z.object({
  type: z.literal('object.file.deleted'),
  payload: filePayload,
})
export const ObjectFileVisibilityUpdatedEventSchema = z.object({
  type: z.literal('object.file.visibility.updated'),
  payload: filePayload.extend({ visibility: z.enum(['public', 'private', 'shared']) }),
})
export const ObjectUserDataEventSchema = z.object({
  type: z.literal('object.user.data'),
  payload: z.object({ userId: uuidV4, state: z.enum(['deleted', 'requested']) }),
})

// Consumed events
export const AuthUserDeletedEventSchema = z.object({
  type: z.literal('auth.user.deleted'),
  payload: z.object({ userId: uuidV4 }),
})
export const LessonFileAttachedEventSchema = z.object({
  type: z.literal('lesson.file.attached'),
  payload: z.object({
    lessonId: z.string().min(1),
    filename: z.union([z.string().min(1), z.array(z.string()).min(1)]),
    authorId: z.string().min(1),
  }),
})

export type ObjectStartedEvent = z.infer<typeof ObjectStartedEventSchema>
export type ObjectFileCreatedEvent = z.infer<typeof ObjectFileCreatedEventSchema>
export type ObjectFileUpdatedEvent = z.infer<typeof ObjectFileUpdatedEventSchema>
export type ObjectFileDeletedEvent = z.infer<typeof ObjectFileDeletedEventSchema>
export type ObjectFileVisibilityUpdatedEvent = z.infer<typeof ObjectFileVisibilityUpdatedEventSchema>
export type ObjectUserDataEvent = z.infer<typeof ObjectUserDataEventSchema>
export type AuthUserDeletedEvent = z.infer<typeof AuthUserDeletedEventSchema>
export type LessonFileAttachedEvent = z.infer<typeof LessonFileAttachedEventSchema>

export type ObjectEvent =
  | ObjectStartedEvent
  | ObjectFileCreatedEvent
  | ObjectFileUpdatedEvent
  | ObjectFileDeletedEvent
  | ObjectFileVisibilityUpdatedEvent
  | ObjectUserDataEvent
