# Local development versus a hospital pilot

The provided run script uses Django's development server on `127.0.0.1`. It is not a production web server and is not reachable from other computers by default. The hard-coded fallback secret is explicitly local-development-only. When DEBUG is disabled a unique environment secret is mandatory.

No public hosting, external account, hospital connection or cloud service has been created by this package.

Before a supervised real-patient pilot, implement and review:

1. Hospital-owned workflow, clinical priority/redirection, operating hours, staff training and no-phone assistance.
2. Hospital permission, privacy/legal review, data minimization, retention and incident response.
3. PostgreSQL concurrency and recovery validation on the actual deployment; do not rely on SQLite for hospital multi-user operation.
4. Production WSGI server, reverse proxy, HTTPS, proper trusted-host/origin settings, unique secrets and restricted network/database access.
5. Individual staff credentials, stronger account recovery, shared rate-limiting storage and MFA/SSO as appropriate. Current login throttling uses a per-process local cache and is not a distributed protection.
6. Backups with encryption and separately managed keys, verified restoration, host patching and monitoring.
7. Staff/guest-network separation and privacy-reviewed display locations. Keep patient data off public screens.
8. On-site outage coordinator, paper fallback, reconciliation and controlled digital restart.
9. A qualified maintainer, documented release process and rollback path.
10. Security and accessibility review of actual workflows; browser checks are not certification.

`python manage.py check --deploy` identifies some configuration problems; passing it alone does not establish security or clinical safety. Do not turn off CSRF or remove authorization checks to make deployment easier.

## Local SQLite backup

For synthetic development data only, stop the server with Ctrl+C and copy `db.sqlite3` to a private backup location. Restart normally. Restore only with the server stopped and after retaining the current file. A backup that has never been restored in a test is not a verified recovery plan. Do not commit the database to Git or include it in shared ZIPs.

## Department settings for local exploration

The seed command creates open departments/counters. There is no administrative settings UI in v0.1. To experiment with a closed department using fictional data:

```bash
source .venv/bin/activate
python manage.py shell
```

```python
from flow.models import Department
Department.objects.filter(slug='general-opd').update(is_open=False)
# To reopen:
Department.objects.filter(slug='general-opd').update(is_open=True)
```

Direct configuration edits like this are local-development actions and are not audited as user workflow changes. A pilot needs an authorized, audited configuration interface. Closing a department hides public calls and prevents new calls; staff must resolve existing service safely.
