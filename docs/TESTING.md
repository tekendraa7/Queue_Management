# Validation record and acceptance checklist

## Automated checks completed

Validated in a Linux workspace using Python 3.12.14, Django 5.2.18 and SQLite.

`python manage.py test flow --verbosity 1`: **30 tests passed**, with no Django system-check issues. Coverage includes registration retries and changed-payload rejection; duplicate active visits and hospital IDs; transaction rollback; FIFO; call idempotency; occupied and closed counters; separate counters; complete consultation lifecycle and audit; identity confirmation; stale versions; invalid transitions; absence/re-entry; cancellation reasons; prior-day visits; role and department boundaries; private page authentication and no-store responses; rendered templates; public JSON without identifiers; CSRF; POST-only mutations; malformed versions; optional phone; escaped HTML; login throttling; and simultaneous calls.

The concurrency test issues two calls through separate connections. It verifies one active assignment; SQLite is allowed to reject one attempt with a controlled retry rather than duplicate the call. This does not prove performance or correctness at hospital load.

Schema migrations and Linux shell script syntax were checked. A fresh-source setup, migration and synthetic-data initialization are part of packaging verification. No database, local account credentials or virtual environment is included in the ZIP.

## Limits of this validation

- PostgreSQL configuration is supplied, but no PostgreSQL server test was run here. Run the suite against PostgreSQL before concurrent staff experiments.
- A Chromium visual/browser check was attempted but blocked by the workspace's socket/process restrictions. Desktop/mobile layout, print output, focus behavior, and browser polling behavior therefore still need visual/end-to-end verification on your Linux machine.
- The public-data/privacy shape is tested at the HTTP response level. Display timeout behavior is implemented in JavaScript but was not executed in a browser here.
- No external hospital interface, SMS/payment provider, medical workflow, real patient, clinical safety or legal compliance was validated.
- No claim of production availability, accessibility certification, penetration-test completion or guaranteed wait reduction is made.

## Local browser acceptance checklist

Start the application and use only synthetic data. Test Firefox and Chromium if possible.

1. Sign in as manager; check overview counts against visible visits.
2. At desktop size and a phone-size width around 390px, confirm text/buttons remain readable and main content does not require horizontal scrolling. Tables may scroll within their own container.
3. Navigate with keyboard only, including skip link, login, registration, queue controls and sign out. Check visible focus.
4. Search and select an existing patient; attempt duplicate active registration and confirm the message.
5. Register a new fictional patient without phone or hospital ID. Double-submit the same form; verify one visit.
6. Print/reprint the token; verify the same token and no identity/health details. Check your actual printer's page/receipt settings.
7. Open two staff windows and the public display. Call from two counters; verify no duplicate active assignment.
8. Start service only after checking the identity confirmation. Finish the consultation and confirm the counter becomes available.
9. Mark a called visit absent with a reason, re-enter it and verify the documented end-of-queue policy.
10. Try a stale form after changing the visit in another window; verify it cannot override the new state.
11. Sign in as reception and as each operator; attempt forbidden pages/actions.
12. Stop the local server with the display open. Old calls should be hidden and staff-help text shown within the timeout window. Restart and confirm reconnection.
13. Confirm developer console contains no unexpected errors and no private data appears in public display responses.
14. Run the same checks after your code changes and record any failing scenario before adding new features.

Use the Stage 2 roadmap only after these checks are satisfactory. Any future live pilot needs substantially more clinical, operational, security and recovery validation.
