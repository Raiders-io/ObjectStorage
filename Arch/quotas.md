# Quotas

## Quota

```mermaid
sequenceDiagram
    actor User
    participant API as API
    participant DB@{ "type" : "database" }
    User->>API: POST /anything
    activate API
    API->>DB: Read User Rate Limit
    activate DB
    DB->>API: Send User Rate Limit
    deactivate DB
    API->>API: Validate Rate Limit
    API->>DB: Update Rate Limit
    activate DB
    deactivate DB
    API->>API: Execute request
    API->>User: OK
    deactivate API
```

---

```mermaid
sequenceDiagram
    actor User
    participant API as API
    participant DB@{ "type" : "database" }
    User->>API: POST /anything
    activate API
    API->>DB: Read User Quotas
    activate DB
    DB->>API: Send User Quotas
    deactivate DB
    API->>API: Validate User Quotas
    API->>DB: Update User Quotas
    activate DB
    deactivate DB
    API->>API: Execute request
    API->>User: OK
    deactivate API
```

```rules
si current_date > upload_count_reset_at | download_count_reset_at
	update to current

si upload_count >= upload_count_limit | download_count >= download_count_limit
	reject

si object_count >= object_count_limit
	reject

si new file + storage_bytes >= storage_bytes_limit
	reject

OK
```

## Rate limiting

## References

Using Mermaid for generating diagrams.

Used this site for export (removed watermark manually) : <https://www.mermaideditor.io/export/svg>
