# Architecture rules

- Keep business storage operations bucket-aware through the provider port; pass original object keys, never generated public URLs, so private and multi-bucket files remain addressable.
- Orchestrate document file cleanup in DocumentService, retain the row when file deletion fails, and roll back newly uploaded files on failed persistence; this prevents silent orphan creation on the normal CRUD paths.
- Normalize campaign scheduling in the application service and persist it through the domain entity; editing and dedicated scheduling must agree.
- Ship the frontend container from the production dist artifact with SPA fallback and JavaScript MIME for PDF workers; keep build inputs and private environment files out of the serving image.
- Self-hosted startup scripts must not generate, rewrite, or print environment secrets; apply application migrations explicitly rather than relying on nested initialization mounts.