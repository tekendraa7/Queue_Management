#     Queue_Management — local Linux starter

**Version 0.1 · Stage 1 · Editable Django source code**

A patient-flow learning prototype for a small outpatient clinic: register a patient, issue a visit token, call from a department queue, verify arrival, start service, and complete the visit. Includes a separate privacy-minimized public display and printable tokens.

This is the first runnable stage of the Nepal patient-flow blueprint. It is not the complete multi-department hospital product. Use fictional data; live hospital use needs a reviewed workflow, security/reliability work, trained staff and hospital authorization.

## 1. Run on Linux (Ubuntu / Linux Lite / Debian)

Download and extract `SewaPath_Linux_Starter_v0.1.zip`. Open a terminal **inside the extracted `sewapath` folder** (the folder containing `manage.py`). No Docker, Node.js or paid hosting is required.

If Python/venv are missing, install them:

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip unzip
```

Then run:

```bash
bash scripts/setup.sh
bash scripts/run.sh
```

Setup installs dependencies in a project-local virtual environment, creates the SQLite database, and asks you to choose and confirm a local demo password. Nothing appears while typing the password; this is normal. Use at least 8 characters and avoid common passwords. Use a new demo password, not a personal password.

Open **http://127.0.0.1:8000** in your browser. Sign in as **`manager`**, with the password you chose. Stop the server with **Ctrl+C**. Start it again with `bash scripts/run.sh`; your local data persists in `db.sqlite3`.

Python 3.10+ is required. On Fedora/Arch or another distribution, install Python and venv support with its own package manager, then use the same project scripts. Initial dependency installation requires internet; after installation, the local app works without internet while the server is running. No service worker/offline write synchronization is implemented.

### Demo accounts

| Username | Role | Access |
|---|---|---|
| `manager` | Demo operations manager | Both department queues, registration, lifecycle actions, activity log |
| `reception` | Reception | Register/find patients, view queues/visits, print tokens, re-enter absent visits |
| `opd` | OPD operator | General OPD only; call, start, complete, mark absent, cancel |
| `family` | OPD operator | Family care only; same assigned-department actions |

Setup gives newly created demo accounts the password you choose. This convenience is for local synthetic demonstrations only. Rerunning setup does not reset existing passwords or duplicate the synthetic patient records.

If you forget a local account password:

```bash
source .venv/bin/activate
python manage.py changepassword manager
```

Choose separate account passwords before any multi-person experiment. Do not share production accounts. Django superuser status alone does not grant app access; a `StaffProfile` is required. No Django admin interface is exposed in this release.

## 2. Try the complete Stage 1 demo

1. Sign in as `manager`. The overview shows today's counts and two sample departments.
2. Select **Register a visit**. Search for `DEMO-008` to select an existing patient, or create a fictional new patient with an optional hospital ID.
3. If a selected patient already has an active visit, the app refuses a duplicate. Find that visit from the overview/queue instead. To demonstrate a new registration, use a new fictional patient.
4. Choose a destination, confirm the identity/duplicate check, and create the visit. A token is allocated once.
5. Choose **Print visit token**. The printout contains token, date and destination, not name, age, phone or clinical information.
6. Open the department queue. There is an existing synthetic consultation at Counter 1 in General OPD; finish it or use Counter 2.
7. Open **public display** in another browser window and keep it visible.
8. Press **Call next patient**. The oldest eligible waiting visit is assigned to the counter and appears on the display.
9. Open the visit, confirm identity, and **Start service**. Then **Complete consultation**. The counter is released.
10. On another called visit, record a recall attempt and mark **Temporarily absent**. Confirm return and re-enter. The demo's routine rule places returning patients at the end; history is retained.
11. Review **Activity log** as manager. Sign out and sign in as `opd` to see the restricted department view.
12. Stop the server while the display is open. It clears old calls and asks the patient to seek staff assistance. Restart and wait for polling to reconnect.

The default queue is routine FIFO (first in, first out). No clinical-priority algorithm exists in v0.1. Urgent cases require qualified staff and the existing hospital pathway; do not make them wait for this demonstration.

## 3. What is included

- Responsive, original teal/cream staff interface; desktop and mobile layouts.
- Session login/logout, role checks and operator department restrictions.
- Patient identity separate from visit identity; optional phone and hospital ID.
- Search-before-registration and a human confirmation step; no automatic identity merging.
- Department/day token numbering, duplicate-submit protection and one active visit per known patient.
- Two-counter OPD calling, routine waiting list, absence and re-entry.
- State/version validation: stale browser actions cannot overwrite a changed visit.
- Database uniqueness constraints and a serialized write path to prevent duplicate active calls.
- Recorded registration, call and state-change history; manager activity screen.
- Private print page and unauthenticated display API with only tokens/counters/counts.
- Public display polling every 3 seconds, timeout handling and stale-data hiding.
- Local SQLite quick start, PostgreSQL settings and instructions.
- Database migrations, synthetic data command, unit/integration/concurrent-call tests.
- Setup scripts, architecture notes, development guide and pilot limitations.

## 4. What is not implemented yet

Billing or payment integration; clinician orders; lab/radiology stages; report access; doctor-return queues; pharmacy; appointments; triage/priority; caregiver permissions; patient-facing private status portal; Nepali translation; SMS/audio calls; QR access; tenant isolation; production backup automation; full audit immutability; medical records.

The current stage has one consultation task per visit. Multiple departments exist to test permissions and queues, not cross-department coordination. English is the implemented UI language. The printable token does not include a QR because patient access authorization has not been built yet.

## 5. Edit the project

Open the entire `sewapath` folder in VS Code, another editor, or an IDE. All application source is included; no proprietary hosted backend is required.

```text
sewapath/
  manage.py                   Django commands
  config/                     Settings and URL routing
  flow/
    models.py                 Patients, visits, counters, roles, audit events
    services.py               Validated registration and queue changes
    access.py                 Role and department authorization
    forms.py                  Input validation
    views.py                  Browser pages and public display API
    tests.py                  Behavior/security/concurrency tests
    migrations/               Versioned database schema and initial mutex
    management/commands/      Synthetic demo setup
  templates/                  Editable HTML templates
  static/app.css              Colors, layout, responsive and print styles
  static/display.js           Safe public display polling
  scripts/                    Linux setup/run/test commands
  docs/                       Architecture, testing and roadmap
```

To change colors, edit the `:root` variables in `static/app.css`. Edit `templates/flow/dashboard.html` to change the overview. Change queue policy only in `flow/services.py`, and update tests and documentation together. Never implement a clinical priority rule without the hospital's qualified workflow owner.

The development server reloads Python changes. Refresh the browser for HTML/CSS/JavaScript changes. If assets look old, use Ctrl+Shift+R.

After changing models:

```bash
source .venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py test flow
```

Do not change or delete existing migrations casually after using real persisted data. See `docs/ARCHITECTURE.md` for invariants.

## 6. Run tests

```bash
bash scripts/test.sh
```

Django creates a separate test database; it does not clear your normal local demo database. The concurrent-call test checks that a racing call cannot reserve the same visit twice. SQLite may return a controlled retry under contention; it is for local learning, not a multi-user hospital deployment.

To reproduce browser checks, install optional dependencies and a browser:

```bash
source .venv/bin/activate
pip install -r requirements-dev.txt
python -m playwright install chromium
```

See `docs/TESTING.md` for the manual acceptance checklist and recorded validation. Browser dependencies may require operating-system packages; Playwright will report them if missing.

## 7. Optional PostgreSQL path

You can learn the project first with SQLite. For concurrent staff testing, use PostgreSQL and run the same test suite against it. This creates a new database; it does not migrate your SQLite records automatically.

On Ubuntu/Debian:

```bash
sudo apt install postgresql
sudo -u postgres createuser --pwprompt sewapath
sudo -u postgres createdb --owner=sewapath sewapath
source .venv/bin/activate
pip install -r requirements-postgres.txt
cp .env.example .env
```

Edit `.env`: uncomment the `DB_ENGINE=postgres` and `POSTGRES_*` settings and enter the database password. Quote shell-special characters carefully because the next command sources a shell file. Only source files you control.

```bash
set -a
source .env
set +a
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

The Django test runner needs permission to create its test database. Grant `CREATEDB` only to the local development database user if needed:

```bash
sudo -u postgres psql -c 'ALTER USER sewapath CREATEDB;'
python manage.py test flow
```

Do not grant this privilege to a production runtime user. See `docs/DEPLOYMENT.md` for limits; PostgreSQL configuration is not a production approval.

## 8. Troubleshooting

| Symptom | Action |
|---|---|
| `No module named venv` / ensurepip unavailable | Install your distribution's `python3-venv` package, then rerun setup |
| `python` command not found | Use `python3` before activating the virtual environment |
| “externally managed environment” | Use the supplied `.venv`; do not install with `sudo pip` |
| Port 8000 is busy | Run `.venv/bin/python manage.py runserver 127.0.0.1:8001` and open that port |
| Database table missing | Run `.venv/bin/python manage.py migrate` |
| Login fails | Use `changepassword`; after 10 failed attempts the local throttle waits up to 5 minutes |
| Active visit prevents registration | Resolve that patient's existing visit; earlier-day active visits appear on the overview |
| No demo visits today | Seed data is not duplicated on rerun. Register new fictional visits; old synthetic records stay intact |
| “Queue busy” / locked database | Reload, check whether the action completed, then retry. Use PostgreSQL for concurrent testing |
| Display blank/paused | Verify the server is running and the department URL is correct; it never keeps showing stale calls as live |
| CSRF failure after login in another tab | Reload the form; the session token may have rotated |
| Cannot reach from phone | Intentional: quick-start binds to your own computer only. Do not expose it publicly as-is |

## 9. Dependencies and source references

This package pins the Django version used during validation. Review security updates before future deployment. Dependencies install from the package index on your machine and keep their own licenses.

- Django install guide: https://docs.djangoproject.com/en/5.2/intro/install/
- Django databases and SQLite limits: https://docs.djangoproject.com/en/5.2/ref/databases/
- Django deployment checklist: https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

The application code is editable. A permissive MIT license for the original starter code is included in `LICENSE`; third-party packages are not relicensed by it. No trademark availability is claimed for SewaPath.
