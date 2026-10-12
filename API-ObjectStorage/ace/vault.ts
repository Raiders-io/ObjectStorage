import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import axios from 'axios'
import { string } from '@vinejs/vine'

export default class VaultSetup extends BaseCommand {
  static commandName = 'vault:setup'
  static description = 'Setup Vault with application secrets'

  @args.string({ description: 'Vault server address' })
  declare addr: string

  @args.string({ description: 'Vault token' })
  declare token: string

  @args.string({ description: 'Secrets path in Vault' })
  declare path: string

  @flags.boolean({ description: 'Skip confirmation' })
  declare force: boolean

  async run() {
    const vaultAddr = this.addr || process.env.VAULT_ADDR || 'http://localhost:8200'
    const vaultToken = this.token || process.env.VAULT_KEY || 'root'
    const secretsPath = this.path || process.env.VAULT_PATH || 'secret/objectstorage'

    this.logger.info(`Setting up Vault at ${vaultAddr}`)
    this.logger.info(`Using token: ${vaultToken.substring(0, 4)}...`)
    this.logger.info(`Secrets path: ${secretsPath}`)

    if (!this.force) {
      const confirmed = await this.prompt.confirm(
        'Are you sure you want to setup Vault with application secrets?'
      )
      if (!confirmed) {
        this.logger.info('Cancelled')
        return
      }
    }

    try {
      // Check if Vault is reachable
      await this.checkVaultHealth(vaultAddr, vaultToken)

      // Get secrets from environment
      const secrets = this.collectSecrets()

      if (Object.keys(secrets).length === 0) {
        this.logger.warning('No secrets found in environment variables')
        return
      }

      // Store secrets in Vault
      await this.storeSecretsInVault(vaultAddr, vaultToken, secretsPath, secrets)

      this.logger.success('Vault setup completed successfully!')
      this.logger.info(`Secrets stored at: ${secretsPath}`)
    } catch (error) {
      this.logger.error(`Vault setup failed: ${error}`)
      process.exit(1)
    }
  }

  private async checkVaultHealth(addr: string, token: string) {
    try {
      const client = axios.create({
        baseURL: addr,
        headers: { 'X-Vault-Token': token }
      })

      const response = await client.get('/v1/sys/health')
      
      if (response.data.status !== 'active') {
        throw new Error(`Vault is not active: ${response.data.status}`)
      }

      this.logger.info('Vault health check passed')
    } catch (error) {
      throw new Error(`Cannot connect to Vault: ${error}`)
    }
  }

  private collectSecrets(): Record<string, string> {
    const secrets: Record<string, string> = {}
    const requiredSecrets = [
      'APP_KEY',
      'AWS_ACCESS_KEY_ID', 
      'AWS_SECRET_ACCESS_KEY',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD'
    ]

    for (const secretName of requiredSecrets) {
      const value = process.env[secretName]
      if (value) {
        secrets[secretName] = value
        this.logger.info(`Collected: ${secretName}`)
      } else {
        this.logger.warning(`Missing environment variable: ${secretName}`)
      }
    }

    return secrets
  }

  private async storeSecretsInVault(
    addr: string,
    token: string,
    path: string,
    secrets: Record<string, string>
  ) {
    const client = axios.create({
      baseURL: addr,
      headers: { 'X-Vault-Token': token }
    })

    // Enable KV v2 secrets engine if not already enabled
    try {
      await client.post('/v1/sys/mounts/secret', {
        type: 'kv-v2'
      })
      this.logger.info('Enabled KV v2 secrets engine')
    } catch (error) {
      // Ignore if already enabled
      this.logger.debug('KV v2 may already be enabled')
    }

    // Write secrets
    try {
      const response = await client.post(`/v1/${path}`, {
        data: secrets
      })

      this.logger.info('Secrets written to Vault')
    } catch (error) {
      throw new Error(`Failed to write secrets: ${error}`)
    }
  }
}
