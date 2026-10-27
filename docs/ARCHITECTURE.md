# Architecture and invariants

## Request flow

Browser → Django authentication/middleware → view input validation → service function → database transaction → response. There is one deployable app, not microservices. HTML uses server templates; only the public display polls JSON. No external patient service is contacted.

## Entities

`Patient` stores the small identity record. `Visit` stores one consultation attendance, department, token and status. `Counter` is a physical service position. `StaffProfile` supplies an explicit app role and operator department. `AuditEvent` records consequential workflow changes. `DailySequence` allocates tokens per department/day. `CallRequest` remembers call request results. `SchedulerLock` is one row seeded by migration.

## State transitions

Registered visits begin waiting. Waiting → called → in_service → completed. Called → absent → waiting is a separate path. Waiting/absent → cancelled requires a reason. Start requires identity confirmation. Every change increments a version; requests with a previous version are rejected rather than overwriting current state.

The routine re-entry policy intentionally joins the end of the queue, unlike some potential hospital policies. `created_at` and audit history retain the initial arrival information. Hospitals must review this rule before any use. Prior-day waiting visits are never automatically called; supervisors resolve them. The dashboard links outstanding earlier visits.

## Queue correctness

- All service writes acquire a single scheduler mutex inside a database transaction. This is deliberate serialization for a small single-hospital prototype; it sacrifices throughput for a simple correctness model.
- PostgreSQL locks the seeded mutex row with `SELECT FOR UPDATE`. SQLite uses an IMMEDIATE transaction to serialize writers; lock failures become a retry message.
- A counter has at most one called/in-service visit, enforced by a partial unique constraint.
- A known patient has at most one active visit across departments, enforced by a partial unique constraint. Unresolved duplicate patient identities remain a human identification risk.
- Counter presence must match visit state via a database check constraint.
- Token sequences and visit creation commit together; failures roll back the patient creation/sequence changes.
- A registration request UUID returns its original result on a retry by the same actor. Treat it as a submission identifier, not a way to update a visit. To modify the intended data, reload and submit a new form.
- Call request UUIDs are bound to actor/counter and record the original result, including an empty queue. A new page load creates a new request.
- Database uniqueness remains a second line of defense if service code is accidentally bypassed, but direct shell writes can violate other workflow assumptions. Use services in future endpoints.

## Permissions

Manager: registration, both departments, workflow actions, activity log. Reception: registration, both department views, print and absence re-entry, but no calling/consultation completion/cancellation. Operator: only assigned department, no registration or global audit page. Anonymous: login and safe public display only. Missing app profile: denied, including superusers without a profile.

The public API returns department-open state, token, counter, status, waiting count and freshness timestamp. It returns no patient/visit UUID, name, age, phone, hospital ID, clinical content or internal audit data. A short token cannot retrieve private records. Real departments may themselves be sensitive; validate public-zone naming before deployment.

## Deliberate omissions

No real-time message broker or notification outbox is needed yet because displays read committed state directly from the database. Add an outbox when SMS or external integrations are built. No clinical result data, online payments, national ID, file uploads or public patient capabilities are stored. No offline writes: browsers cannot queue updates during an outage.

Development uses UTC-aware timestamps with Asia/Kathmandu presentation. The service day is evaluated in Nepal time. No Bikram Sambat conversion is implemented.

## Audit limits

Application pages cannot edit audit events; the database administrator still can. This is an operational history, not tamper-proof forensic storage. Read access/export logging, remote immutable archives and retention controls are future work. Free-text operational reasons must not contain clinical details.
