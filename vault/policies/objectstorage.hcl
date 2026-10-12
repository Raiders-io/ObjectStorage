path "secret/objectstorage/*" {
  capabilities = ["read", "list"]
}

path "secret/objectstorage" {
  capabilities = ["read", "list"]
}
