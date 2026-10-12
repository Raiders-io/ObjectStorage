import { spawnSync, spawn } from 'node:child_process'

/**
 * 0. Load secrets from Vault if VAULT_ADDR is set
 *    This must happen before migration to have DB credentials
 */
if (process.env.VAULT_ADDR) {
  console.log('[Entrypoint] Loading secrets from Vault...')
  const vaultLoader = spawnSync(process.execPath, ['bin/vault-loader.js'], {
    stdio: 'inherit',
  })

  if (vaultLoader.status !== 0) {
    console.error('[Entrypoint] Vault loader failed, exiting...')
    process.exit(vaultLoader.status ?? 1)
  }
  console.log('[Entrypoint] Secrets loaded from Vault')
} else {
  console.log('[Entrypoint] VAULT_ADDR not set, using environment variables directly')
}

/**
 * 1. Start blocking migration ,logs to stdout/stderr
 *   (equivalent to `npm run migration-force`)
 */
const migration = spawnSync(process.execPath, ['ace', 'migration:run', '--force'], {
  stdio: 'inherit',
})

if (migration.status !== 0) {
  // Migration failed : not starting server
  process.exit(migration.status ?? 1)
}

/**
 * 2. Start server as 'main' process
 *    (equivalent `exec "$@"` with CMD)
 */
const server = spawn(process.execPath, ['bin/server.js'], { stdio: 'inherit' })

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})

// Propagate signals (SIGINT, SIGTERM) to the server process
// This allows Adonis to gracefully shutdown its connections (DB, HTTP...)
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.kill(sig))
}
