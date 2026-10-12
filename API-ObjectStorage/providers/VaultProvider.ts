import { ApplicationService } from '@adonisjs/core/types'
// import { string } from '@vinejs/vine'
import axios, { AxiosInstance, AxiosError } from 'axios'

export interface VaultConfig {
  addr: string
  token: string
  path: string
  timeout?: number
}

export interface VaultSecrets {
  APP_KEY: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  POSTGRES_USER: string
  POSTGRES_PASSWORD: string
}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    vault: {
      config: VaultConfig
      client: AxiosInstance
      secrets: VaultSecrets
    }
  }
}

export default class VaultProvider {
  public static needsApplication = true

  private app: ApplicationService

  constructor(application: ApplicationService) {
    this.app = application
  }

  private getConfig(): VaultConfig {
    const config = this.app.config.get<VaultConfig>('vault')

    return {
      addr: config?.addr || process.env.VAULT_ADDR || 'http://localhost:8200',
      token: config?.token || process.env.VAULT_KEY || 'root',
      path: config?.path || process.env.VAULT_PATH || 'secret/objectstorage',
      timeout: config?.timeout || 5000
    }
  }

  private async createClient(config: VaultConfig): Promise<AxiosInstance> {
    const client = axios.create({
      baseURL: config.addr,
      timeout: config.timeout,
      headers: {
        'X-Vault-Token': config.token,
        'Content-Type': 'application/json'
      }
    })

    // Test connection
    try {
      await client.get('/v1/sys/health')
    } catch (error) {
      const axiosError = error as AxiosError
      throw new Error(
        `Vault connection failed: ${axiosError.message}\n` +
        `Please check VAULT_ADDR=${config.addr} and VAULT_KEY is set`
      )
    }

    return client
  }

  private async fetchSecrets(client: AxiosInstance, path: string): Promise<VaultSecrets> {
    try {
      const response = await client.get(`/v1/${path}`)
      const data = response.data.data

      if (!data || !data.data) {
        throw new Error(`No secrets found at path: ${path}`)
      }

      const secrets = data.data as Record<string, string>

      const requiredSecrets = ['APP_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'POSTGRES_USER', 'POSTGRES_PASSWORD']
      const missingSecrets = requiredSecrets.filter(key => !(key in secrets))

      if (missingSecrets.length > 0) {
        throw new Error(
          `Missing required secrets in Vault: ${missingSecrets.join(', ')}\n` +
          `Available secrets: ${Object.keys(secrets).join(', ')}`
        )
      }

      return {
        APP_KEY: secrets.APP_KEY,
        AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
        POSTGRES_USER: secrets.POSTGRES_USER,
        POSTGRES_PASSWORD: secrets.POSTGRES_PASSWORD
      }
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError.response?.status === 403) {
        throw new Error(
          `Vault access denied. Check your VAULT_KEY token has read access to ${path}`
        )
      }
      if (axiosError.response?.status === 404) {
        throw new Error(
          `Vault path not found: ${path}\n` +
          `Make sure secrets are stored at this path`
        )
      }
      throw error
    }
  }

  public async register() {
    const config = this.getConfig()

    this.app.logger.info(`[Vault] Connecting to ${config.addr}`)

    const client = await this.createClient(config)
    this.app.logger.info('[Vault] Connection successful')

    this.app.logger.info(`[Vault] Fetching secrets from ${config.path}`)
    const secrets = await this.fetchSecrets(client, config.path)
    this.app.logger.info('[Vault] Secrets loaded successfully')

    this.app.container.bind('vault', () => ({
      config,
      client,
      secrets
    }))
  }

  public async boot() {
    // Register as a provider
    await this.register()
  }

  public async shutdown() {
    // Cleanup if needed
  }
}
