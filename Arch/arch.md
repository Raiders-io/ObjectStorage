# Arch

Design choices :

- Simple : quick to develop and easier to maintain
- Complete : more complex, but better scalability

## Simple

Validation made by the API (write heavy as API handles routing and read/write of files).
Slower but simpler to make

```mermaid
sequenceDiagram
    actor User
    participant API_object as API
    participant DB@{ "type" : "database" }
    participant S3@{ "type" : "database" }
    User->>API_object: POST /uploads
    API_object->>DB: Create a new entry
    API_object->>API_object: Validate entry
    API_object->>S3: Move file to S3
    API_object->>User: File is ready
```

## Complete

Validation made by a worker, faster as multiple workers can be invoked.
Better scalability

```mermaid
sequenceDiagram
    actor User
    participant API_object as API
    participant DB@{ "type" : "database" }
    participant S3@{ "type" : "database" }
    participant Validation
    User->>API_object: POST /uploads
    API_object->>DB: Retrieve User info
    DB->>API_object: Retrieve User info
    API_object->>API_object: Verify quota and rate limit
    API_object->>DB: Create a new entry
    API_object->>S3: Generate a presigned URL with Quota
    API_object->>Validation: Add entry to queue
    create participant Validation_Worker
    Validation->>Validation_Worker: Consume job
    API_object->>User: Give presigned URL
    User->>S3: Send file
    S3->>Validation_Worker: Download file
    Validation_Worker->>Validation_Worker: Validate entry
    Validation_Worker->>Validation: Mark job as finished
    Validation_Worker->>DB: Mark the entry as ready
    loop Until ready
    User->>API_object: GET /uploads/{id}
    API_object->>DB: Retrieve status
    DB->>API_object: PROCESSING / READY
    API_object->>User: Status
    end
```

## References

Using Mermaid for generating diagrams.

Used this site for export (removed watermark manually) : <https://www.mermaideditor.io/export/svg>
