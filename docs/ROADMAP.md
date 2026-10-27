# Next working increments

## Stage 1 — included

Local staff login, patient/visit registration, two department queues, safe public display, printable tokens, routine consultation lifecycle, role checks and workflow event history.

## Stage 2 — coordinated lab loop

Introduce service tasks separately from visits; prerequisites; source order references; verified cashier status/exemptions; lab collection/processing/released states; a defined doctor review queue. Hold one physical patient reservation across tasks while allowing background laboratory processing. Retain existing clinical records as authoritative. Test unknown payment, partial/rejected specimens, absent patient at result release and next-day review.

## Stage 3 — access and usability

Nepali translations reviewed by native speakers; accessible patient next-step page using explicit scoped access; caregiver grant/revocation; safe QR flow; appointments; real user accessibility sessions. Phones remain optional. Add staff-approved priority/aging/appointment allocation only after actual workflow validation.

## Stage 4 — pilot readiness

Audited configuration, backups/restoration, outage reconciliation tools, production hosting, stronger account controls, critical monitoring and hospital-led training. Test and document every external interface before integration. Keep human triage and emergency handling outside an unvalidated queue policy.

For each increment: agree acceptance criteria, implement a small complete journey, run automated tests, walk it through with staff using synthetic data, document limitations, then decide whether to proceed.
