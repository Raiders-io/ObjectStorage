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
    activate API_object
    API_object->>DB: Create a new entry
    activate DB
    deactivate DB
    API_object->>API_object: Validate entry
    API_object->>S3: Move file to S3
    activate S3
    deactivate S3
    API_object->>User: File is ready
    deactivate API_object
```

## Complete

Validation made by a worker, faster as multiple workers can be invoked.
Better scalability

Notes :
> Worker should be automatically triggered if `POST /uploads/{id}/complete` is never called after a timeout

```mermaid
sequenceDiagram
    actor User
    participant API_object as API
    participant DB@{ "type" : "database" }
    participant S3@{ "type" : "database" }
    participant Validation
    User->>API_object: POST /uploads
    activate API_object
    API_object->>DB: Ask User info
    activate DB
    DB-->>API_object: User info
    API_object->>API_object: Verify quota and rate limit
    API_object->>DB: Create a new entry
    deactivate DB
    API_object->>S3: Ask to generate a presigned URL with Quota
    activate S3
    S3->>API_object: Give presigned URL
    deactivate S3
    API_object->>Validation: Add entry to queue
    activate Validation
    API_object->>User: Give presigned URL
    deactivate API_object
        activate Validation_Worker
        User->>S3: Send file
        activate S3
        S3->>User: OK
        deactivate S3
        User->>API_object: POST /uploads/{id}/complete
        activate API_object
        API_object->>Validation: Trigger Worker to start
        deactivate API_object
    create participant Validation_Worker
        Validation->>Validation_Worker: Consume job
        Validation_Worker->>S3: Request file
        activate S3
        S3->>Validation_Worker: Download file
        deactivate S3
        Validation_Worker->>Validation_Worker: Validate entry
        destroy Validation_Worker
        Validation_Worker->>Validation: Mark job as finished
    Validation->>DB: Mark the entry as ready
    deactivate Validation
    activate DB
    deactivate DB
    loop Until ready
        User->>API_object: GET /uploads/{id}
        activate API_object
        API_object->>DB: Retrieve status
        activate DB
        DB->>API_object: PROCESSING / READY
        deactivate DB
        API_object->>User: Status
        deactivate API_object
    end
```

## References

Using Mermaid for generating diagrams.

Used this site for export (removed watermark manually) : <https://www.mermaideditor.io/export/svg>
