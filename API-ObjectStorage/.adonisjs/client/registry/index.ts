/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [{"old":"/uploads/*","type":0,"val":"uploads","end":""},{"old":"/uploads/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['drive.fs.serve']['types'],
  },
  'updateProfileAvatar': {
    methods: ["POST"],
    pattern: '/profile/avatar',
    tokens: [{"old":"/profile/avatar","type":0,"val":"profile","end":""},{"old":"/profile/avatar","type":0,"val":"avatar","end":""}],
    types: placeholder as Registry['updateProfileAvatar']['types'],
  },
  'storage.objects.listObjects': {
    methods: ["GET","HEAD"],
    pattern: '/storage/objects',
    tokens: [{"old":"/storage/objects","type":0,"val":"storage","end":""},{"old":"/storage/objects","type":0,"val":"objects","end":""}],
    types: placeholder as Registry['storage.objects.listObjects']['types'],
  },
  'storage.objects.createObject': {
    methods: ["POST"],
    pattern: '/storage/objects',
    tokens: [{"old":"/storage/objects","type":0,"val":"storage","end":""},{"old":"/storage/objects","type":0,"val":"objects","end":""}],
    types: placeholder as Registry['storage.objects.createObject']['types'],
  },
  'storage.objects.getObject': {
    methods: ["GET","HEAD"],
    pattern: '/storage/objects/:id',
    tokens: [{"old":"/storage/objects/:id","type":0,"val":"storage","end":""},{"old":"/storage/objects/:id","type":0,"val":"objects","end":""},{"old":"/storage/objects/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['storage.objects.getObject']['types'],
  },
  'storage.objects.updateObject': {
    methods: ["PUT"],
    pattern: '/storage/objects/:id',
    tokens: [{"old":"/storage/objects/:id","type":0,"val":"storage","end":""},{"old":"/storage/objects/:id","type":0,"val":"objects","end":""},{"old":"/storage/objects/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['storage.objects.updateObject']['types'],
  },
  'storage.objects.deleteObject': {
    methods: ["DELETE"],
    pattern: '/storage/objects/:id',
    tokens: [{"old":"/storage/objects/:id","type":0,"val":"storage","end":""},{"old":"/storage/objects/:id","type":0,"val":"objects","end":""},{"old":"/storage/objects/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['storage.objects.deleteObject']['types'],
  },
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
