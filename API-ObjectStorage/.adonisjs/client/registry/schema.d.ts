/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type {
  ExtractBody,
  ExtractErrorResponse,
  ExtractQuery,
  ExtractQueryForGet,
  ExtractResponse,
} from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'drive.fs.serve': {
    methods: ['GET', 'HEAD']
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'storage.objects.listObjects': {
    methods: ['GET', 'HEAD']
    pattern: '/storage/objects'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['index']>>
      >
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['index']>>
      >
    }
  }
  'storage.objects.createObject': {
    methods: ['POST']
    pattern: '/storage/objects'
    types: {
      body: ExtractBody<InferInput<typeof import('#validators/file').FilesValidator>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<typeof import('#validators/file').FilesValidator>>
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['store']>>
      >
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import('#controllers/access_objects_controller').default['store']>>
          >
        | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storage.objects.bulkUpdateObjects': {
    methods: ['PUT']
    pattern: '/storage/objects'
    types: {
      body: ExtractBody<InferInput<typeof import('#validators/file').FilesValidator>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<typeof import('#validators/file').FilesValidator>>
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['updateMany']>>
      >
      errorResponse:
        | ExtractErrorResponse<
            Awaited<
              ReturnType<import('#controllers/access_objects_controller').default['updateMany']>
            >
          >
        | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storage.objects.bulkDeleteObjects': {
    methods: ['DELETE']
    pattern: '/storage/objects'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['destroyMany']>>
      >
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['destroyMany']>>
      >
    }
  }
  'storage.objects.getObject': {
    methods: ['GET', 'HEAD']
    pattern: '/storage/objects/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['show']>>
      >
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['show']>>
      >
    }
  }
  'storage.objects.updateObject': {
    methods: ['PUT']
    pattern: '/storage/objects/:id'
    types: {
      body: ExtractBody<InferInput<typeof import('#validators/file').FilesValidator>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<typeof import('#validators/file').FilesValidator>>
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['update']>>
      >
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import('#controllers/access_objects_controller').default['update']>>
          >
        | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storage.objects.deleteObject': {
    methods: ['DELETE']
    pattern: '/storage/objects/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['destroy']>>
      >
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import('#controllers/access_objects_controller').default['destroy']>>
      >
    }
  }
  'auth.new_account.store': {
    methods: ['POST']
    pattern: '/api/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<typeof import('#validators/user').signupValidator>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<typeof import('#validators/user').signupValidator>>
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>
      >
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>
          >
        | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ['POST']
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<typeof import('#validators/user').loginValidator>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<typeof import('#validators/user').loginValidator>>
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>
      >
      errorResponse:
        | ExtractErrorResponse<
            Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>
          >
        | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ['GET', 'HEAD']
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>
      >
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>
      >
    }
  }
  'profile.access_tokens.destroy': {
    methods: ['POST']
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<
        Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>
      >
      errorResponse: ExtractErrorResponse<
        Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>
      >
    }
  }
}
