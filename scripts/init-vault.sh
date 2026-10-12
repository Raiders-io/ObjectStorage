#!/bin/bash

# Script to initialize Vault with application secrets
# Usage: ./scripts/init-vault.sh [vault_token] [secrets_path]

set -e

VAULT_TOKEN=${1:-root}
SECRETS_PATH=${2:-secret/objectstorage}
VAULT_ADDR=${3:-http://localhost:8200}

echo "Initializing Vault at ${VAULT_ADDR}"
echo "Using token: ${VAULT_TOKEN:0:4}..."
echo "Secrets path: ${SECRETS_PATH}"

# Check if Vault is running
if ! vault status -address=${VAULT_ADDR} -token=${VAULT_TOKEN} &>/dev/null; then
    echo "Error: Cannot connect to Vault at ${VAULT_ADDR}"
    echo "Make sure Vault is running and accessible"
    exit 1
fi

echo "Vault is running and accessible"

# Enable KV v2 secrets engine if not already enabled
if ! vault secrets list -address=${VAULT_ADDR} -token=${VAULT_TOKEN} | grep -q "secret/"; then
    echo "Enabling KV v2 secrets engine at 'secret'"
    vault secrets enable -address=${VAULT_ADDR} -token=${VAULT_TOKEN} -path=secret -version=2 kv || true
else
    echo "KV v2 secrets engine is already enabled"
fi

# Collect secrets from environment variables
APP_KEY=${APP_KEY:?}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:?}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:?}
POSTGRES_USER=${POSTGRES_USER:?}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?}

echo ""
echo "Collecting secrets from environment:"
echo "  - APP_KEY: ${APP_KEY:0:8}..."
echo "  - AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:8}..."
echo "  - AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:0:8}..."
echo "  - POSTGRES_USER: ${POSTGRES_USER}"
echo "  - POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:8}..."

# Write secrets to Vault
echo ""
echo "Writing secrets to Vault at ${SECRETS_PATH}..."

vault kv put -address=${VAULT_ADDR} -token=${VAULT_TOKEN} ${SECRETS_PATH} \
    APP_KEY="${APP_KEY}" \
    AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
    AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
    POSTGRES_USER="${POSTGRES_USER}" \
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

echo ""
echo "Secrets written to Vault successfully!"
echo ""
echo "To verify, run:"
echo "  vault kv get -address=${VAULT_ADDR} -token=${VAULT_TOKEN} ${SECRETS_PATH}"
