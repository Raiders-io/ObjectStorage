import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

const AvatarSchema = vine.file({
  size: '2mb',
    extnames: ['jpg', 'png', 'jpeg', 'webp'],
})

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

/**
 * Validator to use before validating a avatar for a user 
 * during profile creation or avatar profile update
 */
export const AvatarValidator = vine.create({
  avatar: AvatarSchema
})

/**
 * Validator to use before writing to DB multiple files
 */
export const AvatarsValidator = vine.create({
  avatars: vine.array(AvatarSchema).maxLength(10) // Max 10 avatars at once
})
export const MultipleAvatarsValidator = AvatarsValidator // Alias for better readability when validating multiple avatars
