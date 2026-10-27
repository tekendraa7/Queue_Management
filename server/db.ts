import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { buildInitialState, StoreState, DEPARTMENTS, COUNTERS, STAFF_USERS } from '../src/store/queueStore';
import { Visit, Patient, AuditEvent } from '../src/types';

// Ensure data folder exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'smartq.db');
const db = new DatabaseSync(DB_FILE);

// Set PRAGMAs for concurrency & reliability
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
} catch (e) {
  console.warn('Could not set WAL pragma:', e);
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hospital_id TEXT,
    bima_number TEXT,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    is_senior INTEGER DEFAULT 0,
    has_disability INTEGER DEFAULT 0,
    is_pregnant INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    request_key TEXT,
    patient_id TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    counter_id INTEGER,
    date TEXT NOT NULL,
    token TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    status TEXT NOT NULL,
    sub_queue TEXT NOT NULL,
    is_clinical_emergency INTEGER DEFAULT 0,
    active_location_dept_id INTEGER,
    orders_json TEXT,
    prescription_notes TEXT,
    created_at TEXT NOT NULL,
    queued_at TEXT NOT NULL,
    called_at TEXT,
    started_at TEXT,
    finished_at TEXT,
    version INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    visit_id TEXT NOT NULL,
    visit_token TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_state_backup (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Seed database if uninitialized
function initializeSeedIfNeeded(): void {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM app_state_backup');
  const result = checkStmt.get() as { count: number } | undefined;
  
  if (!result || result.count === 0) {
    console.log('SmartQ SQLite database is empty. Seeding initial hospital data...');
    const initialState = buildInitialState();
    saveFullState(initialState);
    console.log('SmartQ SQLite initialized successfully with 14 OPD departments.');
  }
}

export function saveFullState(state: StoreState): void {
  const now = new Date().toISOString();

  // Save atomic full snapshot for rapid reconstruction
  const upsertBackup = db.prepare(`
    INSERT INTO app_state_backup (id, data_json, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
  `);
  upsertBackup.run(JSON.stringify(state), now);

  // Sync relational tables
  const insertPatient = db.prepare(`
    INSERT INTO patients (id, name, hospital_id, bima_number, age, gender, phone, is_senior, has_disability, is_pregnant, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      hospital_id = excluded.hospital_id,
      bima_number = excluded.bima_number,
      age = excluded.age,
      gender = excluded.gender,
      phone = excluded.phone,
      is_senior = excluded.is_senior,
      has_disability = excluded.has_disability,
      is_pregnant = excluded.is_pregnant
  `);

  for (const p of state.patients) {
    insertPatient.run(
      p.id,
      p.name,
      p.hospitalId || null,
      p.bimaNumber || null,
      p.age || null,
      p.gender || null,
      p.phone || null,
      p.isSenior ? 1 : 0,
      p.hasDisability ? 1 : 0,
      p.isPregnant ? 1 : 0,
      p.createdAt
    );
  }

  const insertVisit = db.prepare(`
    INSERT INTO visits (
      id, request_key, patient_id, department_id, counter_id, date, token, pin_code,
      status, sub_queue, is_clinical_emergency, active_location_dept_id,
      orders_json, prescription_notes, created_at, queued_at, called_at, started_at, finished_at, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      counter_id = excluded.counter_id,
      status = excluded.status,
      sub_queue = excluded.sub_queue,
      is_clinical_emergency = excluded.is_clinical_emergency,
      active_location_dept_id = excluded.active_location_dept_id,
      orders_json = excluded.orders_json,
      prescription_notes = excluded.prescription_notes,
      called_at = excluded.called_at,
      started_at = excluded.started_at,
      finished_at = excluded.finished_at,
      version = excluded.version
  `);

  for (const v of state.visits) {
    insertVisit.run(
      v.id,
      v.requestKey,
      v.patientId,
      v.departmentId,
      v.counterId || null,
      v.date,
      v.token,
      v.pinCode,
      v.status,
      v.subQueue,
      v.isClinicalEmergency ? 1 : 0,
      v.activeLocationDeptId || null,
      JSON.stringify(v.orders || []),
      v.prescriptionNotes || null,
      v.createdAt,
      v.queuedAt,
      v.calledAt || null,
      v.startedAt || null,
      v.finishedAt || null,
      v.version || 0
    );
  }

  const insertAudit = db.prepare(`
    INSERT INTO audit_events (id, actor, visit_id, visit_token, action, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  for (const a of state.auditEvents) {
    insertAudit.run(a.id, a.actor, a.visitId, a.visitToken, a.action, a.reason || null, a.createdAt);
  }
}

export function getFullState(): StoreState {
  try {
    const backupStmt = db.prepare('SELECT data_json FROM app_state_backup WHERE id = 1');
    const row = backupStmt.get() as { data_json: string } | undefined;
    if (row && row.data_json) {
      const parsed = JSON.parse(row.data_json);
      if (parsed && Array.isArray(parsed.visits) && Array.isArray(parsed.departments)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading from SQLite backup, falling back to fresh state', err);
  }

  const fresh = buildInitialState();
  saveFullState(fresh);
  return fresh;
}

export function verifyPatientVisitAuth(token: string, pinCode: string): Visit | null {
  const normToken = token.trim().toUpperCase();
  const normPin = pinCode.trim();

  // Search inside SQLite state
  const state = getFullState();
  const found = state.visits.find(
    (v) => v.token.toUpperCase() === normToken && v.pinCode === normPin
  );

  return found || null;
}

export function resetDatabase(): StoreState {
  const fresh = buildInitialState();
  saveFullState(fresh);
  return fresh;
}

export function getDatabaseStats() {
  const pCount = (db.prepare('SELECT COUNT(*) as c FROM patients').get() as any)?.c || 0;
  const vCount = (db.prepare('SELECT COUNT(*) as c FROM visits').get() as any)?.c || 0;
  const aCount = (db.prepare('SELECT COUNT(*) as c FROM audit_events').get() as any)?.c || 0;
  const backup = db.prepare('SELECT updated_at FROM app_state_backup WHERE id = 1').get() as any;

  return {
    engine: 'SQLite3 (node:sqlite)',
    dbFile: DB_FILE,
    status: 'connected',
    totalPatients: pCount,
    totalVisits: vCount,
    totalAuditLogs: aCount,
    lastUpdatedAt: backup?.updated_at || null,
  };
}

// Run initial seed check on module load
initializeSeedIfNeeded();
