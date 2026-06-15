#!/bin/sh

# This script generates a garage.toml configuration file for the Garage object storage service.

cat > garage.toml <<EOF
# Configuration file for Garage daemon
# Documentation available at: https://garagehq.deuxfleurs.fr/documentation/reference-manual/configuration/

replication_factor = 1
consistency_mode = "consistent"

# Directories
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
# As we will not be using snapshots, we don't need to backup the metadata snapshots.
metadata_snapshots_dir = "/var/lib/garage/snapshots"

# metadata_fsync = true
# data_fsync = false
# disable_scrub = false
# use_local_tz = false
# metadata_auto_snapshot_interval = "6h"

# Storage engine used as backend for metadata. Options: "lmdb", "sqlite", "fjall". Default is "lmdb".
db_engine = "sqlite"

# The size of each block in bytes. Default is 1MB.
block_size = "1M"
# block_ram_buffer_max = "256MiB"
# block_max_concurrent_reads = 16
# block_max_concurrent_writes_per_request =10
# lmdb_map_size = "1T"

# Compression level for data blocks. Default is 1.
# 0: zstd chooses the default compression level (3)
# 1: normal faster compression
# 'none': no compression
compression_level = 1

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"
rpc_bind_outgoing = false
rpc_secret = "$(openssl rand -hex 32)"

# Useful when db_engine is set to "sled"
# Sled has been removed since v1.0
# The capacity of the cache used by sled, the database Garage uses internally to store metadata, in bytes. Default is 128MB.
# sled_cache_capacity = 134217728
# sled_flush_every_ms = 2000

# allow_punycode = false

# [consul_discovery]
# api = "catalog"
# consul_http_addr = "https://127.0.0.1:8500"
# tls_skip_verify = false
# service_name = "garage-daemon"

# ca_cert = "/etc/consul/consul-ca.crt"
# # for \`agent\` API mode, unset client_cert and client_key:
# client_cert = "/etc/consul/consul-client.crt"
# client_key = "/etc/consul/consul-key.crt"

# # optionally enable \`token\` for authentication:
# # token = "abcdef-01234-56789"

# tags = [ "dns-enabled" ]
# meta = { dns-acl = "allow trusted" }
# datacenters = ["dc1", "dc2", "dc3"]

# [kubernetes_discovery]
# namespace = "garage"
# service_name = "garage-daemon"
# skip_crd = false

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.garage.localhost"

# [s3_web]
# bind_addr = "[::]:3902"
# root_domain = ".web.garage.localhost"
# add_host_to_metrics = true

[admin]
api_bind_addr = "[::]:3903"
admin_token = "$(openssl rand -base64 32)"
metrics_token = "$(openssl rand -base64 32)"
# metrics_require_token = true
# trace_sink = "http://localhost:4317"

EOF
