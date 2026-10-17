# Architecture rules

- Keep business storage operations bucket-aware through the provider port; pass original object keys, never generated public URLs, so private and multi-bucket files remain addressable.
- Orchestrate document file cleanup in DocumentService, retain the row when file deletion fails, and roll back newly uploaded files on failed persistence; this prevents silent orphan creation on the normal CRUD paths.
- Normalize campaign scheduling in the application service and persist it through the domain entity; editing and dedicated scheduling must agree.
- Ship the frontend container from the production dist artifact with SPA fallback and JavaScript MIME for PDF workers; keep build inputs and private environment files out of the serving image.
- Self-hosted startup scripts must not generate, rewrite, or print environment secrets; apply application migrations explicitly rather than relying on nested initialization mounts.
- Communication actions must resolve user contacts through UserService and check provider results before claiming delivery; recipient IDs are not phone numbers or email addresses.
- Inspection updates must persist dates and inspector IDs and read back the stored entity; the inspection workflow policy lives in the inspections referential, not in presentation code.
- Supplier uploads must use DocumentService once with the supplier association; shared cleanup and rollback prevent duplicate files and unlinked records.
- ConsultantScopeService filters project-bound presentation records; server-side permissions remain authoritative and are not replaced by UI filtering.
- Payment initiation limits, approval chains, and deadlines come from the injectable payment-initiation referential; DTO compatibility exports must not own business rules.
- InspectionComplianceService evaluates phase evidence against the inspection-compliance referential; pending or rejected inspections must not count as completed compliance evidence.