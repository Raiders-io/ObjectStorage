import { defineConfig } from '@adonisjs/core/bodyparser'

/**
 * Body parser config for API-ObjectStorage.
 * Adjust the limits and allowed content types as needed for your application.
 * //TODO: Adjust the limits (and fieldsLimit) and allowed content types as needed for your application.
 */

const bodyParserConfig = defineConfig({
  /**
   * Parse request bodies for these HTTP methods.
   * Keep this aligned with methods that receive payloads in your routes.
   */
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Config for the "application/x-www-form-urlencoded"
   * content-type parser.
   */
  form: {
    /**
     * Normalize empty string values to null.
     */
    convertEmptyStringsToNull: true,

    /**
     * Content types handled by the form parser.
     */
    types: ['application/x-www-form-urlencoded'],
    limit: '1mb',
  },

  /**
   * Config for the JSON parser.
   */
  json: {
    /**
     * Normalize empty string values to null.
     */
    convertEmptyStringsToNull: true,

    /**
     * Content types handled by the JSON parser.
     */
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
    limit: '1mb',
  },

  /**
   * Config for the "multipart/form-data" content-type parser.
   * File uploads are handled by the multipart parser.
   */
  multipart: {
    /**
     * Automatically process uploaded files into the system tmp directory.
     */
    autoProcess: true,

    /**
     * Normalize empty string values to null.
     */
    convertEmptyStringsToNull: true,

    /**
     * Routes where multipart processing is handled manually.
     */
    processManually: [],

    /**
     * Maximum accepted payload size for multipart requests.
     */
    limit: '20mb',
    /**
     * Maximum accepted size for non-file form fields in multipart requests.
     * Limits abuses where an attacker could send a large number of small fields
     * to exhaust server resources without sending large files.
     */
    fieldsLimit: '2mb',

    /**
     * Content types handled by the multipart parser.
     */
    types: ['multipart/form-data'],
  },
})

export default bodyParserConfig
