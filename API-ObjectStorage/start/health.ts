import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck, MemoryRSSCheck } from '@adonisjs/core/health'
import { DbCheck } from '@adonisjs/lucid/database'
import db from '@adonisjs/lucid/services/db'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck()
    .cacheFor('10 minutes')
    .warnWhenExceeds(80)
    .failWhenExceeds(90),
  new MemoryHeapCheck()
    .cacheFor('10 minutes')
    .warnWhenExceeds('300 mb')
    .failWhenExceeds('700 mb'),
  new MemoryRSSCheck()
    .cacheFor('10 minutes')
    .warnWhenExceeds('600 mb')
    .failWhenExceeds('800 mb'),
  new DbCheck(db.connection()),
])