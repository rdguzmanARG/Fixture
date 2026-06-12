import cron from 'node-cron';
import { syncMatchResults } from '../services/matchSync.js';

cron.schedule('*/5 * * * *', async () => {
  try {
    await syncMatchResults();
  } catch (err) {
    console.error('[sync] Cron error:', err.message);
  }
});

console.log('[sync] Match result sync scheduled (every 5 minutes)');
