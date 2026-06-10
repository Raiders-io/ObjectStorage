import { UserQuotaSchema } from '#database/schema'

export default class Quota extends UserQuotaSchema {
  public static table = 'user_quotas'
}
