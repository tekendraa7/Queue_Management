import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { getFullState, saveFullState, verifyPatientVisitAuth, resetDatabase, getDatabaseStats } from './server/db';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    try {
      res.json({
        status: 'ok',
        service: 'SmartQ Hospital Queue Engine',
        database: getDatabaseStats(),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Get full hospital state from SQLite
  app.get('/api/state', (req, res) => {
    try {
      const state = getFullState();
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve state from SQLite', details: err.message });
    }
  });

  // Persist hospital state updates to SQLite
  app.post('/api/state', (req, res) => {
    try {
      const newState = req.body;
      if (!newState || !Array.isArray(newState.visits) || !Array.isArray(newState.departments)) {
        return res.status(400).json({ error: 'Invalid state schema provided' });
      }
      saveFullState(newState);
      res.json({ success: true, updatedVisits: newState.visits.length });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to persist state to SQLite database', details: err.message });
    }
  });

  // Secure patient authentication for Mero Palo dashboard using Token + PIN
  app.post('/api/auth/patient', (req, res) => {
    try {
      const { token, pinCode } = req.body || {};
      if (!token || !pinCode) {
        return res.status(400).json({ error: 'Token and 4-digit PIN code are required' });
      }

      const visit = verifyPatientVisitAuth(String(token), String(pinCode));
      if (!visit) {
        return res.status(401).json({ error: 'Invalid Token or 4-digit PIN code. Please check your printed slip.' });
      }

      res.json({ success: true, visit });
    } catch (err: any) {
      res.status(500).json({ error: 'Authentication service error', details: err.message });
    }
  });

  // Reset database back to clean initial demo seed
  app.post('/api/reset-demo', (req, res) => {
    try {
      const fresh = resetDatabase();
      res.json({ success: true, state: fresh });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reset demo database', details: err.message });
    }
  });

  // Mount Vite middleware in development or serve static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartQ Full-Stack Server running on http://0.0.0.0:${PORT}`);
    console.log(`SQLite database engine initialized at ./data/smartq.db`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
