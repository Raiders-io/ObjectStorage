import { defineConfig } from '@adonisjs/core/helpers'

export interface VaultConfig {
  /**
   * Vault server address (e.g., http://localhost:8200)
   */
  addr: string

  /**
   * Vault authentication token
   */
  token: string

  /**
   * Path to secrets in Vault (e.g., secret/objectstorage)
   */
  path: string

  /**
   * Request timeout in milliseconds
   */
  timeout?: number
}

export default defineConfig({
  addr: process.env.VAULT_ADDR || 'http://vault:8200',
  token: process.env.VAULT_KEY || 'root',
  path: process.env.VAULT_PATH || 'secret/objectstorage',
  timeout: 5000
} satisfies VaultConfig)
