import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'storage.objects.listObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.createObject': { paramsTuple?: []; params?: {} }
    'storage.objects.bulkUpdateObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.bulkDeleteObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.getObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage.objects.updateObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage.objects.deleteObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quota.retrieveQuota': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'storage.objects.listObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.getObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quota.retrieveQuota': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'storage.objects.listObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.getObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quota.retrieveQuota': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'storage.objects.createObject': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'storage.objects.bulkUpdateObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.updateObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'storage.objects.bulkDeleteObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.deleteObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}