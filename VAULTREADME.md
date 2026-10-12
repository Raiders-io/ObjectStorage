# HashiCorp Vault Configuration for Object Storage

This setup integrates HashiCorp Vault with the AdonisJS Object Storage API to securely manage sensitive configuration secrets.

## Overview

The following secrets are now stored in Vault instead of environment variables:

- `APP_KEY` - Application encryption key
- `AWS_ACCESS_KEY_ID` - AWS S3 access key
- `AWS_SECRET_ACCESS_KEY` - AWS S3 secret key
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password

All other configuration remains in environment variables.

## Architecture

```md
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Object API    │────▶│     Vault       │     │   PostgreSQL    │
│   Container     │     │   Container     │     │   Container     │
│                 │◀────│                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Setup Instructions

### 1. Add Vault Token to Environment

Add the following to your `.env` file or export them in your shell:

```bash
# Vault Configuration
VAULT_ADDR=http://vault:8200
VAULT_KEY=root  # Change this to a secure token in production
VAULT_PATH=secret/objectstorage
```

### 2. Initialize Vault with Secrets

Before starting your application, populate Vault with your secrets:

#### Option A: Using the Shell Script

```bash
# Export your secrets to the environment
export APP_KEY="your_app_key"
export AWS_ACCESS_KEY_ID="your_aws_key"
export AWS_SECRET_ACCESS_KEY="your_aws_secret"
export POSTGRES_USER="your_db_user"
export POSTGRES_PASSWORD="your_db_password"

# Run the initialization script
./scripts/init-vault.sh [vault_token] [secrets_path]

# Example:
./scripts/init-vault.sh root secret/objectstorage
```

#### Option B: Using AdonisJS Command

```bash
# Run the Vault setup command
node ace vault:setup

# Or with custom parameters
node ace vault:setup http://localhost:8200 mytoken secret/objectstorage
```

#### Option C: Manually Using Vault CLI

```bash
# Enable KV v2 secrets engine
vault secrets enable -path=secret -version=2 kv

# Write secrets
vault kv put secret/objectstorage \
    APP_KEY="your_app_key" \
    AWS_ACCESS_KEY_ID="your_aws_key" \
    AWS_SECRET_ACCESS_KEY="your_aws_secret" \
    POSTGRES_USER="your_db_user" \
    POSTGRES_PASSWORD="your_db_password"
```

### 3. Start Services with Docker Compose

```bash
# Start all services including Vault
docker-compose up -d

# Or rebuild and start
docker-compose up -d --build
```

### 4. Verify Vault is Working

```bash
# Check Vault status
docker-compose exec vault vault status

# List secrets
vault kv list secret/objectstorage

# Get a specific secret
vault kv get secret/objectstorage
```

## Configuration Files

### Docker Compose (`compose.yml`)

The Vault service is defined in the main `compose.yml`:

- Uses `hashicorp/vault:1.16.0` image
- Development mode with root token
- Persistent storage at `/vault/file`
- Health check endpoint

### Vault Configuration (`vault/config.hcl`)

Basic Vault configuration:

- File storage backend
- TCP listener on port 8200
- Development mode settings

### Vault Policy (`vault/policies/objectstorage.hcl`)

Policy for the Object Storage service:

- Read access to `secret/objectstorage/*`
- List access to `secret/objectstorage`

### AdonisJS Provider (`providers/VaultProvider.ts`)

The Vault provider:

- Connects to Vault on application start
- Fetches all required secrets
- Makes them available in the container
- Validates that all required secrets are present

### Entrypoint Script (`entrypoint.mjs`)

Modified to:

1. Load secrets from Vault (if VAULT_ADDR is set)
2. Run database migrations
3. Start the application server

### Vault Loader (`bin/vault-loader.js`)

Standalone script that:

1. Connects to Vault
2. Fetches all secrets from the configured path
3. Sets them as environment variables
4. Starts the main server

## Environment Variables

### Required for Object API

```bash
# Application
API_PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info
APP_URL=http://localhost:3333

# Services
AUTH_SERVICE_URL=http://auth-service:3333
SESSION_DRIVER=cookie
DRIVE_DISK=s3

# S3 Configuration (non-sensitive)
AWS_REGION=us-east-1
S3_BUCKET=object-storage
S3_ENDPOINT=http://garage:3900

# PostgreSQL Configuration (non-sensitive)
POSTGRES_SERVICE_NAME=object-db
POSTGRES_PORT=5432
POSTGRES_DB=objectstorage

# Vault Configuration
VAULT_ADDR=http://vault:8200
VAULT_KEY=root
VAULT_PATH=secret/objectstorage
```

### Required for Vault

```bash
# Only needed for development
VAULT_DEV_ROOT_TOKEN_ID=root
```

## Production Considerations

### Security Best Practices

1. **Use a Secure Token**: In production, don't use the root token. Create a dedicated token with minimal permissions:

   ```bash
   # Create a policy
   vault policy write objectstorage-read vault/policies/objectstorage.hcl
   
   # Create a token with the policy
   vault token create -policy=objectstorage-read -ttl=24h
   ```

2. **Enable TLS**: Configure Vault with TLS in production:

   ```hcl
   listener "tcp" {
     address       = "0.0.0.0:8200"
     tls_cert_file = "/vault/certs/vault.crt"
     tls_key_file  = "/vault/certs/vault.key"
   }
   ```

3. **Use TLS in Application**: Update `VAULT_ADDR` to use HTTPS:

   ```bash
   VAULT_ADDR=https://vault:8200
   ```

4. **Rotate Tokens**: Regularly rotate Vault tokens and application keys.

5. **Audit Logging**: Enable Vault audit logging in production:

   ```bash
   vault audit enable file file_path=/vault/logs/audit.log
   ```

### High Availability

For production, consider using:

- Vault in HA mode with multiple nodes
- Consul or etcd for storage backend
- Auto-unseal with cloud KMS

## Troubleshooting

### Vault Connection Failed

```sh
Error: Vault connection failed
```

Check:

1. Vault container is running: `docker-compose ps`
2. Vault is healthy: `docker-compose exec vault vault status`
3. Correct VAULT_ADDR: should be `http://vault:8200` (service name in Docker)
4. Correct VAULT_KEY: verify the token is valid

### Missing Secrets in Vault

```
Error: Missing required secrets: APP_KEY,AWS_ACCESS_KEY_ID,...
```

Run the initialization script:
```bash
./scripts/init-vault.sh
```

Or manually add secrets:
```bash
vault kv put secret/objectstorage APP_KEY=your_key ...
```

### Permission Denied

```
Error: Vault access denied
```

Check:
1. The token has read access to the secrets path
2. The policy allows read on `secret/objectstorage/*`
3. The path exists in Vault

### Secrets Not Loading in Application

1. Verify VAULT_ADDR is set in the object-api container
2. Check logs: `docker-compose logs object-api`
3. Manually test: `docker-compose exec object-api node bin/vault-loader.js`

## Development

### Testing Without Vault

To test locally without Vault, simply don't set VAULT_ADDR:

```bash
# Don't set VAULT_ADDR, use environment variables directly
npm run dev
```

The application will use environment variables directly.

### Resetting Vault

```bash
# Stop and remove Vault container
docker-compose down -v

# This will also remove Vault data volume
# On next start, Vault will be initialized fresh
```

## Files Modified/Created

- `compose.yml` - Added Vault service, updated object-api environment
- `API-ObjectStorage/Dockerfile` - No changes needed
- `API-ObjectStorage/entrypoint.mjs` - Added Vault loader at startup
- `API-ObjectStorage/package.json` - axios already present
- `API-ObjectStorage/config/vault.ts` - New Vault configuration file
- `API-ObjectStorage/providers/VaultProvider.ts` - New Vault provider
- `API-ObjectStorage/ace/vault.ts` - New Vault setup command
- `API-ObjectStorage/bin/vault-loader.js` - New Vault secret loader
- `vault/config.hcl` - New Vault configuration
- `vault/policies/objectstorage.hcl` - New Vault policy
- `scripts/init-vault.sh` - New initialization script
- `VAULTREADME.md` - This documentation
