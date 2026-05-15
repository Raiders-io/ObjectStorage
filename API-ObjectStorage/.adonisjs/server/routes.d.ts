import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'storage.objects.listObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.createObject': { paramsTuple?: []; params?: {} }
    'storage.objects.getObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage.objects.updateObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage.objects.deleteObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'storage.objects.listObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.getObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'storage.objects.listObjects': { paramsTuple?: []; params?: {} }
    'storage.objects.getObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'storage.objects.createObject': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'storage.objects.updateObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'storage.objects.deleteObject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}