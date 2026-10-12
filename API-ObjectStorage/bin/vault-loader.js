#!/usr/bin/env node

/**
 * Vault Secret Loader
 * 
 * This script loads secrets from HashiCorp Vault and exports them
 * as environment variables before starting the application.
 * 
 * Usage:
 *   node bin/vault-loader.js && node bin/server.js
 * 
 * Environment variables:
 *   VAULT_ADDR - Vault server address (default: http://vault:8200)
 *   VAULT_KEY - Vault authentication token (default: root)
 *   VAULT_PATH - Path to secrets in Vault (default: secret/objectstorage)
 */

import axios from 'axios'

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200'
const VAULT_KEY = process.env.VAULT_KEY || 'root'
const VAULT_PATH = process.env.VAULT_PATH || 'secret/objectstorage'

const REQUIRED_SECRETS = [
  'APP_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD'
]

async function main() {
  console.log(`[Vault Loader] Connecting to ${VAULT_ADDR}`)

  const client = axios.create({
    baseURL: VAULT_ADDR,
    timeout: 5000,
    headers: {
      'X-Vault-Token': VAULT_KEY,
      'Content-Type': 'application/json'
    }
  })

  try {
    // Check Vault health
    await client.get('/v1/sys/health')
    console.log('[Vault Loader] Vault is healthy')

    // Fetch secrets
    console.log(`[Vault Loader] Fetching secrets from ${VAULT_PATH}`)
    const response = await client.get(`/v1/${VAULT_PATH}`)
    const data = response.data.data

    if (!data || !data.data) {
      throw new Error(`No secrets found at path: ${VAULT_PATH}`)
    }

    const secrets = data.data
    
    // Validate required secrets
    const missingSecrets = REQUIRED_SECRETS.filter(key => !(key in secrets))
    if (missingSecrets.length > 0) {
      throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`)
    }

    // Export secrets as environment variables
    for (const [key, value] of Object.entries(secrets)) {
      if (REQUIRED_SECRETS.includes(key)) {
        console.log(`[Vault Loader] Setting ${key}`)
        process.env[key] = value
      }
    }

    console.log('[Vault Loader] All secrets loaded successfully')
    console.log('[Vault Loader] Starting application...')

    // Start the application
    const { default: server } = await import('./server.js')
    await server()
  } catch (error) {
    console.error('[Vault Loader] Error:', error.message)
    if (error.response) {
      console.error('[Vault Loader] Status:', error.response.status)
      console.error('[Vault Loader] Data:', error.response.data)
    }
    process.exit(1)
  }
}

main().catch(error => {
  console.error('[Vault Loader] Fatal error:', error)
  process.exit(1)
})
